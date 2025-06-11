// matchmaking.ts
import type { Namespace, Socket } from 'socket.io';
import { startMatch, updateMatch, MatchState } from './gameSimulation.js';
import { startTriMatch, TriMatchState } from './TripongSimulation.js';
import { dbManager } from '../../database/database.js';

interface PlayerInfo {
  side: number;               // 0|1 for bi-pong, 0|1|2 for tri-pong, -1 for solo modes
  mode: 'solo' | 'multi' | 'tri' | 'solo-tri';
  roomId?: string;
}

interface Player { id: string; username: string; }

interface Tournament {
  id: string;
  size: 4|8;
  players: Player[];     // list of players in the current round
  allPlayers: Player[];
  round: number;         // 0 = 1st round, 1 = final
  winners: Player[];     // players qualified for the next round
  ready: Map<string, boolean>;
  playRound?: (pairs: Array<[Player, Player]>, round: number) => void; // for 8 players
}

interface BasicTournament {
  id: string;
  players: Player[];
  ready: Map<string, boolean>;
  round: number; // 0 = semi-finals, 1 = final
  matches: { [k: string]: { players: [Player, Player], winner?: Player } };
  finalists: Player[];
  finalReady: Map<string, boolean>;
  champion?: Player;
  allPlayers: Player[]; // Added for the complete status
  finalLaunched?: boolean; // NEW: guard to prevent double-launch
}

// Private rooms management
export const privateRooms = new Map<string, { sockets: Socket[]; usernames: string[]; maxPlayers: number }>();

export function setupGameMatchmaking(gameNs: Namespace, io: import('socket.io').Server) {
  const playerInfo = new Map<string, PlayerInfo>();
  // New Map to store the user ID to find later
  const socketToUserId = new Map<string, string>();
  let classicQueue: Player[] = [];
  let triQueue: Player[] = [];
  const matchStates = new Map<string, MatchState>();
  const triMatchStates = new Map<string, TriMatchState>();
  // Map of complete or pending tournaments, grouped by id
  // Store BasicTournament for the 4-player tournament
  const tournaments = new Map<string, BasicTournament>();
  const tournamentQueues: { [k in 4|8]: Player[] } = { 4: [], 8: [] };

  // Map to store the intervals of each tournament match
  const tournamentMatchIntervals = new Map<string, NodeJS.Timeout>();

  // Utility function to get the user ID from a socket_id
  function getUserIdFromSocketId(socketId: string): string | undefined {
    return socketToUserId.get(socketId);
  }

  // Utility function to send a system message in the global chat
  async function sendTournamentChatMessage(content: string) {
    try {
      const chatNs = io.of('/chat');
      chatNs.emit('receiveMessage', {
        author: 'system', // 0 or "System" to indicate a system message
        content,
        timestamp: new Date().toISOString()
      });
      // Add: save the message in the history
      await dbManager.saveMessage(0, content);
    } catch (e) {
      console.error('[TOURNOI] Impossible d\'envoyer le message chat tournoi:', e);
    }
  }

  gameNs.on('connection', socket => {
    
    // TOURNAMENT
    socket.on( 'joinTournamentQueue', async ({ username, userId }: { username: string, userId?: string }) => {
        if (userId) socketToUserId.set(socket.id, userId);
        const q = tournamentQueues[4];
        // Blocking anti-duplicate userId BEFORE adding to the queue
        const userIdsInQueue = q.map(p => (p.id && socketToUserId.get(p.id)) || p.id);
        if (userId && userIdsInQueue.includes(userId)) {
          socket.emit('error', { message: 'Tournoi bloqué : multi-fenêtre ou double connexion détectée.' });
          return;
        }
        if (!q.find(p => p.id === socket.id)) {
          q.push({ id: socket.id, username });
        }

        q.forEach(p =>
          gameNs.sockets
            .get(p.id)
            ?.emit('tournamentBracket', {
              size: 4,
              joined: q.map(p2 => p2.username),
              status: q.map(p2 => ({
                id: p2.id,
                username: p2.username,
                ready: false,
                eliminated: false,
                isInGame: false // No one is in game until the tournament has started
              }))
            })
        );
  
        // As soon as the queue is full, create and launch the tournament
        if (q.length === 4) {
          // Check that there is no duplicate userId in the 4 players
          const userIds = q.map(p => (p.id && socketToUserId.get(p.id)) || p.id);
          const uniqueUserIds = new Set(userIds);
          if (uniqueUserIds.size < 4) {
            // Find the index of the duplicate (the 2nd, 3rd or 4th)
            let idxToRemove = 1;
            if (userIds[1] === userIds[0]) idxToRemove = 1;
            else if (userIds[2] === userIds[0] || userIds[2] === userIds[1]) idxToRemove = 2;
            else idxToRemove = 3;
            const removed = q.splice(idxToRemove, 1)[0];
            const sock = gameNs.sockets.get(removed.id);
            if (sock) sock.emit('error', { message: 'Tournoi bloqué : multi-fenêtre ou double connexion détectée.' });
            // We don't launch the tournament, we wait for a real 4th player
            return;
          }
          const tour: BasicTournament = {
            id: crypto.randomUUID(),
            players: q.slice(),
            ready: new Map(q.map((p: Player) => [p.id, false])),
            round: 0,
            matches: {},
            finalists: [],
            finalReady: new Map(),
            champion: undefined,
            allPlayers: q.slice() // Added here
          };
          tournaments.set(tour.id, tour as any);
          tournamentQueues[4] = [];
          tour.players.forEach((p: Player) => gameNs.sockets.get(p.id)?.join(`tour-${tour.id}`));
          gameNs.to(`tour-${tour.id}`).emit('tournamentBracket', {
            tournamentId: tour.id,
            size: 4,
            joined: tour.allPlayers.map((p: Player) => p.username),
            status: tour.allPlayers.map((p: Player) => ({
              id: p.id,
              username: p.username,
              ready: false,
              eliminated: false,
              isInGame: false // default at start
            }))
          });
        }
      });

      socket.on('playerReady', ({ tournamentId }: { tournamentId: string }) => {
        const tour = tournaments.get(tournamentId) as BasicTournament;
        if (!tour) return;
        if (tour.round === 0) {
          tour.ready.set(socket.id, true);
          gameNs.to(`tour-${tour.id}`).emit('tournamentReadyUpdate', {
            tournamentId: tour.id,
            size: 4,
            joined: tour.allPlayers.map((p: Player) => p.username),
            status: tour.allPlayers.map((p: Player) => ({
              id: p.id,
              username: p.username,
              ready: tour.ready.get(p.id) || false,
              eliminated: false,
              isInGame: false // No one is in game until the match has started
            }))
          });
          if ([...tour.ready.values()].every((v: boolean) => v)) {
            // Launch the two semi-finals
            tour.round = 0;
            const [A, B, C, D] = tour.players;
            const match1Id = `${tour.id}-demi1`;
            const match2Id = `${tour.id}-demi2`;
            tour.matches[match1Id] = { players: [A, B] };
            tour.matches[match2Id] = { players: [C, D] };
            const demiFinales: [Player, Player, string][] = [
              [A, B, match1Id],
              [C, D, match2Id]
            ];
            for (const [p1, p2, matchId] of demiFinales) {
              const s1 = gameNs.sockets.get(p1.id)!;
              const s2 = gameNs.sockets.get(p2.id)!;
              s1.join(matchId);
              s2.join(matchId);
              playerInfo.set(p1.id, { side: 0, mode: 'multi', roomId: matchId });
              playerInfo.set(p2.id, { side: 1, mode: 'multi', roomId: matchId });
              s1.emit('tournamentMatchFound', { matchId, side: 0, opponent: p2.username });
              s2.emit('tournamentMatchFound', { matchId, side: 1, opponent: p1.username });
              const state = startMatch([s1, s2], gameNs, false, matchId);
              matchStates.set(matchId, state);
              const iv = setInterval(() => {
                updateMatch(state, gameNs);
                gameNs.to(matchId).emit('gameState', state);
                if (state.gameOver) clearInterval(iv);
              }, 1000 / 60);
            }
            // Announce the semi-finals in the chat
            const now = new Date();
            const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const msg = `[TOURNOI PONG] Demi-finales (${heure}) :\nMatch 1 : @${A.username} vs @${B.username}\nMatch 2 : @${C.username} vs @${D.username}`;
            sendTournamentChatMessage(msg);
          }
        } else if (tour.round === 1) {
          // Only allow 'Ready' for the final if both semi-finals are finished and both finalists are known
          if (!tour.finalists || tour.finalists.length !== 2) return;
          if (tour.finalLaunched) return; // Prevent ready after final launched
          tour.finalReady.set(socket.id, true);
          gameNs.to(`tour-${tour.id}`).emit('tournamentReadyUpdate', {
            tournamentId: tour.id,
            size: 4,
            joined: tour.finalists.map((p: Player) => p.username),
            status: tour.finalists.map((p: Player) => ({
              id: p.id,
              username: p.username,
              ready: tour.finalReady.get(p.id) || false,
              eliminated: false,
              isInGame: false // No one is in game until the final has started
            }))
          });
          if ([...tour.finalReady.values()].every((v: boolean) => v)) {
            // Launch the final (guarded)
            if (!tour.finalLaunched) {
              tour.finalLaunched = true;
              const [F1, F2] = tour.finalists;
              const finalId = `${tour.id}-final`;
              const s1 = gameNs.sockets.get(F1.id)!;
              const s2 = gameNs.sockets.get(F2.id)!;
              // --- ADD: all players join the final room (spectators included) ---
              tour.allPlayers.forEach(p => {
                const sock = gameNs.sockets.get(p.id);
                if (sock) sock.join(finalId);
              });
              // --- Only the two finalists are controllers ---
              playerInfo.set(F1.id, { side: 0, mode: 'multi', roomId: finalId });
              playerInfo.set(F2.id, { side: 1, mode: 'multi', roomId: finalId });
              s1.emit('tournamentMatchFound', { matchId: finalId, side: 0, opponent: F2.username });
              s2.emit('tournamentMatchFound', { matchId: finalId, side: 1, opponent: F1.username });

              // Emit to eliminated players so they can spectate the final
              tour.allPlayers.forEach(p => {
                if (p.id !== F1.id && p.id !== F2.id) {
                  const sock = gameNs.sockets.get(p.id);
                  if (sock) {
                    sock.join(finalId); // join the final room for spectating
                    sock.emit('tournamentFinalSpectate', {
                      matchId: finalId,
                      finalists: [F1.username, F2.username]
                    });
                  }
                }
              });

              const state = startMatch([s1, s2], gameNs, false, finalId);
              matchStates.set(finalId, state);
              const iv = setInterval(() => {
                updateMatch(state, gameNs);
                gameNs.to(finalId).emit('gameState', state);
                if (state.gameOver) clearInterval(iv);
              }, 1000 / 60);
              // Announce the final in the chat
              const now = new Date();
              const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const msg = `[TOURNOI PONG] Finale (${heure}) : @${F1.username} vs @${F2.username}`;
              sendTournamentChatMessage(msg);
            }
          }
        }
      });

      socket.on('tournamentReportResult', ({ tournamentId, matchId }) => {
        const tour = tournaments.get(tournamentId) as BasicTournament;
        if (!tour) return;
        const state = matchStates.get(matchId);
        if (!state) return;
        const winSide = state.paddles.findIndex(pl => pl.lives > 0);
        const matchObj = tour.matches[matchId] as { players: [Player, Player], winner?: Player };
        if (!matchObj) return;
        const [P1, P2] = matchObj.players;
        const winner = winSide === 0 ? P1 : P2;
        matchObj.winner = winner;
        // PATCH: complete status with all players and eliminated
        const allMatchesLocal = Object.values(tour.matches) as { players: [Player, Player], winner?: Player }[];
        const status = tour.allPlayers.map((p: Player) => {
          // Find the player's match
          const m = allMatchesLocal.find(m2 => m2.players.some(pl => pl.id === p.id));
          const eliminated = m?.winner ? (m.winner.id !== p.id) : false;
          // We consider ready only if the ready/finalReady map says so
          let ready = false;
          if (tour.round === 0) ready = tour.ready.get(p.id) || false;
          else if (tour.round === 1 && tour.finalReady) ready = tour.finalReady.get(p.id) || false;
          // isInGame: the player is in a match not finished and not eliminated
          let isInGame = false;
          if (m && !m.winner && !eliminated) isInGame = true;
          return {
            id: p.id,
            username: p.username,
            ready: ready,
            eliminated: eliminated,
            isInGame: isInGame
          };
        });
        gameNs.to(`tour-${tour.id}`).emit('tournamentBracket', {
          tournamentId: tour.id,
          size: 4,
          joined: tour.allPlayers.map((p: Player) => p.username),
          status: status
        });
        // --- If the two semi-finals are finished, prepare the final ---
        const allMatches = Object.values(tour.matches) as { players: [Player, Player], winner?: Player }[];
        if (tour.round === 0 && allMatches.filter(m => m.winner).length === 2) {
          // Only set finalists if not already set
          if (!tour.finalists || tour.finalists.length !== 2) {
            tour.finalists = allMatches.map(m => m.winner!) as Player[];
            tour.finalReady = new Map(tour.finalists.map(p => [p.id, false]));
            tour.finalLaunched = false;
            // PATCH: Create the final in tour.matches with the good matchId
            const finalMatchId = `${tour.id}-final`;
            tour.matches[finalMatchId] = { players: [tour.finalists[0], tour.finalists[1]] };
          }
          tour.round = 1;
          gameNs.to(`tour-${tour.id}`).emit('tournamentBracket', {
            tournamentId: tour.id,
            size: 4,
            joined: tour.players.map(p => p.username),
            status: tour.players.map(p => {
              const m = allMatches.find(m2 => m2.players.some(pl => pl.id === p.id));
              const eliminated = m?.winner ? (m.winner.id !== p.id) : false;
              return { id: p.id, username: p.username, ready: false, eliminated: eliminated };
            })
          });
          // Do NOT launch the final here; wait for both finalists to click Ready and the guard in playerReady
          return;
        }
        // If this is the final, declare the winner only once
        if (tour.round === 1 && matchId.endsWith('-final') && !tour.champion) {
          tour.champion = winner;
          gameNs.to(matchId).emit('tournamentMatchOver', {
            tournamentId: tour.id,
            matchId,
            winner: winner.username,
            loser: winSide === 0 ? P2.username : P1.username
          });
          gameNs.to(`tour-${tour.id}`).emit('tournamentOver', { winner: winner.username });
          // Add: global chat message with gold medal
          sendTournamentChatMessage(`🥇 ${winner.username} remporte le tournoi Pong !`);
          tournaments.delete(tour.id);
        }
      });


    // 1) SOLO CLASSIC
    socket.on('startSolo', ({ username, userId }: { username: string, userId?: string }) => {
      // Store the association socket_id -> user_id if available
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      
      const m = startMatch([socket, socket], gameNs, true);
      matchStates.set(m.roomId, m);
      playerInfo.set(socket.id, { side: 0, mode: 'solo' });
      socket.join(m.roomId);
      socket.emit('matchFound', { roomId: m.roomId, side: 0, mode: 'solo', you: username, opponent: username });
      const iv = setInterval(() => {
        updateMatch(m, gameNs);
        gameNs.to(m.roomId).emit('gameState', m);
        if (m.gameOver) {
          clearInterval(iv);
        }
      }, 1000 / 60);
    });

    socket.on('startSoloVsBot', ({ username, userId }: { username: string, userId?: string }) => {
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      
      const m = startMatch([socket], gameNs, true);
      matchStates.set(m.roomId, m);
      playerInfo.set(socket.id, { side: 0, mode: 'solo' });
      socket.join(m.roomId);
      socket.emit('matchFound', { roomId: m.roomId, side: 0, mode: 'solo', you: username, opponent: 'Bot' });
      
      // Add the bot logic
      const botInterval = setInterval(() => {
        if (m.gameOver) {
          clearInterval(botInterval);
          return;
        }

        const ball = m.ball;
        const botPaddle = m.paddles[1];
        const playerPaddle = m.paddles[0];
        
        const RADIUS = 340;
        const dx = ball.vx;
        const dy = ball.vy;
        
        const b = ball.y - (dy/dx) * ball.x;
        
        const a = 1 + (dy/dx) * (dy/dx);
        const c = 2 * b * (dy/dx);
        const d = b * b - RADIUS * RADIUS;
        
        const discriminant = c * c - 4 * a * d;
        if (discriminant >= 0) {
          const x1 = (-c + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-c - Math.sqrt(discriminant)) / (2 * a);
          
          const x = (dx > 0) ? Math.max(x1, x2) : Math.min(x1, x2);
          const y = (dy/dx) * x + b;
          
          const targetAngle = Math.atan2(y, x);
          
          const error = (Math.random() - 0.5) * 0.2;
          const finalAngle = targetAngle + error;
          
          let botAngleDiff = finalAngle - botPaddle.phi;
          if (botAngleDiff > Math.PI) botAngleDiff -= 2 * Math.PI;
          if (botAngleDiff < -Math.PI) botAngleDiff += 2 * Math.PI;
          const botDistance = Math.abs(botAngleDiff);

          let playerAngleDiff = finalAngle - playerPaddle.phi;
          if (playerAngleDiff > Math.PI) playerAngleDiff -= 2 * Math.PI;
          if (playerAngleDiff < -Math.PI) playerAngleDiff += 2 * Math.PI;
          const playerDistance = Math.abs(playerAngleDiff);

          const PADDLE_WIDTH = 0.3;
          
          if (botDistance < playerDistance) {
            if (botDistance > PADDLE_WIDTH / 2) {
              botPaddle.direction = botAngleDiff > 0 ? 'down' : 'up';
            } else {
              botPaddle.direction = null;
            }
          } else {
            const oppositeAngle = finalAngle + Math.PI;
            let escapeAngleDiff = oppositeAngle - botPaddle.phi;
            if (escapeAngleDiff > Math.PI) escapeAngleDiff -= 2 * Math.PI;
            if (escapeAngleDiff < -Math.PI) escapeAngleDiff += 2 * Math.PI;
            
            if (Math.abs(escapeAngleDiff) > PADDLE_WIDTH) {
              botPaddle.direction = escapeAngleDiff > 0 ? 'down' : 'up';
            } else {
              botPaddle.direction = null;
            }
          }
        } else {
          let angleDiff = -Math.PI/2 - botPaddle.phi;
          if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
          
          if (Math.abs(angleDiff) > 0.1) {
            botPaddle.direction = angleDiff > 0 ? 'down' : 'up';
          } else {
            botPaddle.direction = null;
          }
        }
      }, 1000 / 60);

      const iv = setInterval(() => {
        updateMatch(m, gameNs);
        gameNs.to(m.roomId).emit('gameState', m);
        if (m.gameOver) {
          clearInterval(iv);
          clearInterval(botInterval);
        }
      }, 1000 / 60);
    });

    // 2) SOLO TRI-PONG
    socket.on('startSoloTri', ({ username, userId }: { username: string, userId?: string }) => {
      // Store the association socket_id -> user_id if available
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      
      const m = startTriMatch([socket, socket, socket], gameNs, true);
      triMatchStates.set(m.roomId, m);
      playerInfo.set(socket.id, { side: 0, mode: 'solo-tri' });
      socket.join(m.roomId);
      socket.emit('matchFoundTri', {
        roomId: m.roomId,
        side: 0,
        players: [username, username, username],
        mode: 'solo-tri'
      });
      const iv = setInterval(() => {
        updateMatch(m, gameNs);
        gameNs.to(m.roomId).emit('gameState', m);
        if (m.gameOver) clearInterval(iv);
      }, 1000 / 60);
    });

    // 3) 2-PLAYERS MATCHMAKING
    socket.on('joinQueue', ({ username, userId }: { username: string, userId?: string }) => {
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      // Blocking anti-duplicate userId BEFORE adding to the queue
      const userIdsInQueue = classicQueue.map(p => getUserIdFromSocketId(p.id) || p.id);
      if (userId && userIdsInQueue.includes(userId)) {
        socket.emit('error', { message: 'account already connected on a matchmaking' });
        return;
      }
      const currentInfo = playerInfo.get(socket.id);
      if (currentInfo && currentInfo.mode === 'multi') {
        socket.emit('error', { message: 'Vous êtes déjà dans une partie en cours' });
        return;
      }
      if (!classicQueue.some(p => p.id === socket.id)) {
        classicQueue.push({ id: socket.id, username });
      }
      // New logic: search for 2 players with different userId
      while (classicQueue.length >= 2) {
        const p1 = classicQueue[0];
        const p2 = classicQueue[1];
        const userId1 = getUserIdFromSocketId(p1.id) || p1.id;
        const userId2 = getUserIdFromSocketId(p2.id) || p2.id;
        if (userId1 === userId2) {
          // Duplicate userId, remove the 2nd player and send him an error
          const removed = classicQueue.splice(1, 1)[0];
          const sock = gameNs.sockets.get(removed.id);
          if (sock) sock.emit('error', { message: 'Tournoi bloqué : multi-fenêtre ou double connexion détectée.' });
          continue;
        }
        // Otherwise, we can match
        classicQueue.shift();
        classicQueue.shift();
        const s1 = gameNs.sockets.get(p1.id)!;
        const s2 = gameNs.sockets.get(p2.id)!;
        // Conversion userIds en number si possible
        const userIdNum1 = Number(userId1);
        const userIdNum2 = Number(userId2);
        const m = startMatch([s1, s2], gameNs, false, undefined, [userIdNum1, userIdNum2]);
        matchStates.set(m.roomId, m);
        playerInfo.set(p1.id, { side: 0, mode: 'multi' });
        playerInfo.set(p2.id, { side: 1, mode: 'multi' });
        s1.join(m.roomId);
        s2.join(m.roomId);

        // Include the players IDs in the `matchFound` event
        s1.emit('matchFound', {
          roomId: m.roomId,
          side: 0,
          mode: 'multi',
          you: p1.username,
          opponent: p2.username,
          user1Id: userId1,
          user2Id: userId2
        });
        s2.emit('matchFound', {
          roomId: m.roomId,
          side: 1,
          mode: 'multi',
          you: p2.username,
          opponent: p1.username,
          user1Id: userId1,
          user2Id: userId2
        });
        const iv = setInterval(async () => {
          await updateMatch(m, gameNs);
          gameNs.to(m.roomId).emit('gameState', m);
          if (m.gameOver) {
            clearInterval(iv);
            // --- Ajout gestion stats backend ---
            if (m.userIds && m.userIds.length === 2) {
              const [id1, id2] = m.userIds;
              const winSide = m.paddles.findIndex(pl => pl.lives > 0);
              const pongGameId = 1;
              const user1Lives = m.paddles[0].lives;
              const user2Lives = m.paddles[1].lives;
              try {
                // Ajout historique du match
                await dbManager.addMatchToHistory(id1, id2, pongGameId, user1Lives, user2Lives);
                // Victoires/défaites
                if (winSide === 0) {
                  await dbManager.incrementPlayerWins(pongGameId, id1);
                  await dbManager.incrementPlayerLosses(pongGameId, id2);
                } else if (winSide === 1) {
                  await dbManager.incrementPlayerWins(pongGameId, id2);
                  await dbManager.incrementPlayerLosses(pongGameId, id1);
                }
              } catch (e) {
                console.error('[PONG] Erreur update stats/historique:', e);
              }
            }
          }
        }, 1000 / 60);
      }
    });

    // 4) MANAGEMENT OF THE BI-PONG PADDLE MOVEMENTS
    socket.on('movePaddle', (data: { side: 0|1, direction: 'up'|'down'|null }) => {
      const info = playerInfo.get(socket.id);
      if (!info) return;

      // we accept the move in solo **and** in multi, as long as it's our socket
      if ((info.mode === 'multi' && info.side !== data.side) || (info.mode !== 'multi' && info.mode !== 'solo')) {
        return;
      }
      let roomId = info.roomId;
      if (!roomId)
        roomId = [...socket.rooms].find(r => r !== socket.id);
      if (!roomId) return;
      const m = matchStates.get(roomId);
      if (!m) return;
      // we move only *this one* that we asked for
      m.paddles[data.side].direction = data.direction;
    });

    // 5) 3-PLAYERS TRIPONG MATCHMAKING
    socket.on('joinTriQueue', ({ username, userId }: { username: string, userId?: string }) => {
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      // Blocking anti-duplicate userId BEFORE adding to the queue
      const userIdsInQueue = triQueue.map(p => getUserIdFromSocketId(p.id) || p.id);
      if (userId && userIdsInQueue.includes(userId)) {
        socket.emit('error', { message: 'account already connected on a matchmaking' });
        return;
      }
      const currentInfo = playerInfo.get(socket.id);
      if (currentInfo && (currentInfo.mode === 'multi' || currentInfo.mode === 'tri')) {
        socket.emit('error', { message: 'Vous êtes déjà dans une partie en cours' });
        return;
      }
      if (!triQueue.some(p => p.id === socket.id)) {
        triQueue.push({ id: socket.id, username });
      }
      attemptTriMatch();
    });

    socket.on('movePaddleTri', (data: { side: number; direction: 'up' | 'down' | null }) => {
      const info = playerInfo.get(socket.id);
      if (!info) return;
      if (info.mode === 'tri' && info.side !== data.side) return;
      if (info.mode !== 'tri' && info.mode !== 'solo-tri') return;
      const roomId = [...socket.rooms].find(r => r !== socket.id);
      if (!roomId) return;
      const m = triMatchStates.get(roomId)!;
      m.paddles[data.side].direction = data.direction;
    });

    // New event to get the user ID from a socket_id
    socket.on('getUserIdFromSocketId', (data: { socketId: string }, callback: (userId: string | null) => void) => {
      const userId = getUserIdFromSocketId(data.socketId);
      callback(userId || null);
    });

    // 6) DISCONNECTION
    socket.on('disconnect', () => {
      classicQueue = classicQueue.filter(p => p.id !== socket.id);
      triQueue     = triQueue.filter(p => p.id !== socket.id);
    });

    // --- PRIVATE ROOM ---
    socket.on('createPrivateRoom', ({ username, nbPlayers }, callback) => {
      const roomId = crypto.randomUUID();
      privateRooms.set(roomId, { sockets: [socket], usernames: [username], maxPlayers: nbPlayers });
      socket.join(roomId);
      callback({ roomId });
    });

    socket.on('joinPrivateRoom', ({ roomId, username }, callback) => {
      const room = privateRooms.get(roomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }
      if (room.sockets.length >= room.maxPlayers) {
        callback({ error: 'Room is full' });
        return;
      }
      room.sockets.push(socket);
      room.usernames.push(username);
      socket.join(roomId);
      callback({ roomId });
      // If the room is full, we launch the game
      if (room.sockets.length === room.maxPlayers) {
        if (room.maxPlayers === 2) {
          const m = startMatch(room.sockets, gameNs, false);
          matchStates.set(roomId, m);
          playerInfo.set(room.sockets[0].id, { side: 0, mode: 'multi' });
          playerInfo.set(room.sockets[1].id, { side: 1, mode: 'multi' });
          room.sockets[0].emit('matchFound', {
            roomId,
            side: 0,
            mode: 'multi',
            you: room.usernames[0],
            opponent: room.usernames[1],
            user1Id: room.sockets[0].id,
            user2Id: room.sockets[1].id
          });
          room.sockets[1].emit('matchFound', {
            roomId,
            side: 1,
            mode: 'multi',
            you: room.usernames[1],
            opponent: room.usernames[0],
            user1Id: room.sockets[0].id,
            user2Id: room.sockets[1].id
          });
          const iv = setInterval(() => {
            updateMatch(m, gameNs);
            gameNs.to(roomId).emit('gameState', m);
            if (m.gameOver) clearInterval(iv);
          }, 1000 / 60);
        } else if (room.maxPlayers === 3) {
          const m = startTriMatch(room.sockets, gameNs, false);
          triMatchStates.set(roomId, m);
          room.sockets.forEach((s, i) => {
            playerInfo.set(s.id, { side: i, mode: 'tri' });
            s.emit('matchFoundTri', {
              roomId,
              side: i,
              players: room.usernames,
              mode: 'multi'
            });
          });
          const iv = setInterval(() => {
            updateMatch(m, gameNs);
            gameNs.to(roomId).emit('gameState', m);
            if (m.gameOver) clearInterval(iv);
          }, 1000 / 60);
        }
        privateRooms.delete(roomId);
      }
    });

    socket.on('leavePrivateRoom', ({ roomId }) => {
      const room = privateRooms.get(roomId);
      if (room) {
        room.sockets = room.sockets.filter(s => s.id !== socket.id);
        room.usernames = room.usernames.filter((_, i) => room.sockets[i].id !== socket.id);
        if (room.sockets.length === 0) privateRooms.delete(roomId);
      }
      socket.leave(roomId);
    });

    // --- Quit tournament at READY step ---
    socket.on('quitTournament', ({ tournamentId }: { tournamentId: string }) => {
      // Remove from queue if not started
      let found = false;
      for (const size of [4, 8] as const) {
        const idx = tournamentQueues[size].findIndex(p => p.id === socket.id);
        if (idx !== -1) {
          tournamentQueues[size].splice(idx, 1);
          // Update bracket for remaining players
          tournamentQueues[size].forEach(p =>
            gameNs.sockets.get(p.id)?.emit('tournamentBracket', {
              size,
              joined: tournamentQueues[size].map(p2 => p2.username),
              status: tournamentQueues[size].map(p2 => ({
                id: p2.id,
                username: p2.username,
                ready: false,
                eliminated: false,
                isInGame: false
              }))
            })
          );
          found = true;
        }
      }
      if (found) return;
      // If tournament already started (exists in tournaments map)
      const tour = tournaments.get(tournamentId) as BasicTournament;
      if (!tour) return;
      // Remove from allPlayers and players
      tour.allPlayers = tour.allPlayers.filter(p => p.id !== socket.id);
      tour.players = tour.players.filter(p => p.id !== socket.id);
      tour.ready.delete(socket.id);
      if (tour.finalReady) tour.finalReady.delete(socket.id);
      // Mark as eliminated in matches
      Object.values(tour.matches).forEach(m => {
        if (m.players[0].id === socket.id || m.players[1].id === socket.id) {
          // If match not finished, mark the other as winner
          if (!m.winner) {
            m.winner = m.players[0].id === socket.id ? m.players[1] : m.players[0];
          }
        }
      });
      // If only one player remains, declare winner
      if (tour.allPlayers.length === 1) {
        const winner = tour.allPlayers[0];
        gameNs.to(`tour-${tour.id}`).emit('tournamentOver', { winner: winner.username });
        tournaments.delete(tour.id);
        return;
      }
      // Broadcast updated bracket
      const allMatchesLocal = Object.values(tour.matches) as { players: [Player, Player], winner?: Player }[];
      const status = tour.allPlayers.map((p: Player) => {
        const m = allMatchesLocal.find(m2 => m2.players.some(pl => pl.id === p.id));
        const eliminated = m?.winner ? (m.winner.id !== p.id) : false;
        let ready = false;
        if (tour.round === 0) ready = tour.ready.get(p.id) || false;
        else if (tour.round === 1 && tour.finalReady) ready = tour.finalReady.get(p.id) || false;
        let isInGame = false;
        if (m && !m.winner && !eliminated) isInGame = true;
        return {
          id: p.id,
          username: p.username,
          ready: ready,
          eliminated: eliminated,
          isInGame: isInGame
        };
      });
      gameNs.to(`tour-${tour.id}`).emit('tournamentBracket', {
        tournamentId: tour.id,
        size: 4,
        joined: tour.allPlayers.map((p: Player) => p.username),
        status: status
      });
    });
  });

  function launchMatches(ns: Namespace, tour: Tournament) {
    const players = tour.players;
    tour.winners = [];

    for (let i = 0; i < players.length; i += 2) {
      const A = players[i], B = players[i + 1];
      const matchId = `${tour.id}-r${tour.round}-m${i/2}`;
      const sA = ns.sockets.get(A.id)!;
      const sB = ns.sockets.get(B.id)!;
  
      // → Room + playerInfo
      sA.join(matchId);
      sB.join(matchId);
      playerInfo.set(A.id, { side: 0, mode: 'multi', roomId: matchId });
      playerInfo.set(B.id, { side: 1, mode: 'multi', roomId: matchId });
  
      // → Signal "match trouvé"
      sA.emit('tournamentMatchFound', { matchId, side: 0, opponent: B.username });
      sB.emit('tournamentMatchFound', { matchId, side: 1, opponent: A.username });
  
      // → Lancer la simulation
      const state = startMatch([sA, sB], ns, false);
      matchStates.set(matchId, state);
  
      // → Lancer l'intervalle et le stocker dans la Map
      const iv = setInterval(() => {
        updateMatch(state, ns);
        ns.to(matchId).emit('gameState', state);

        if (state.gameOver) {
          clearInterval(iv);
          tournamentMatchIntervals.delete(matchId);

          const winSide = state.paddles.findIndex(pl => pl.lives > 0);
          const winner  = winSide === 0 ? A : B;
          const loser   = winSide === 0 ? B : A;

          // Notifier seulement ces deux joueurs que le match est fini
          ns.to(matchId).emit('tournamentMatchOver', {
            tournamentId: tour.id,
            matchId,
            winner:  winner.username,
            loser:   loser.username
          });

          tour.winners.push(winner);

          // Si tous les matchs de ce round sont finis, préparer le round suivant
          if (tour.winners.length === players.length / 2) {
            const totalRounds = Math.log2(tour.size);

            if (tour.round + 1 < totalRounds) {
              // … calculer les perdants, ajuster tour.players, tour.ready …
              tour.round++;
              tour.players = tour.winners.slice();
              tour.winners = [];
              tour.ready.clear();
              tour.players.forEach(p => tour.ready.set(p.id, false));
              // Relancer les matchs du round suivant
              launchMatches(ns, tour);
            } else {
              // Tournoi terminé
              const champion = tour.winners[0];
              ns.to(matchId).emit('tournamentMatchOver', {
                tournamentId: tour.id,
                matchId,
                winner:  champion.username,
                loser:   ""
              });
              ns.to(`tour-${tour.id}`).emit('tournamentOver', {
                winner: champion.username
              });
              tournaments.delete(tour.id);
            }
          }
        }
      }, 1000 / 60);
      tournamentMatchIntervals.set(matchId, iv);
    }
  }
  
  // Nouvelle logique de tournoi simple à 4 joueurs
  function launchTournament4(ns: Namespace, tour: Tournament) {
    // 1er tour : 2 matchs séparés
    const [A, B, C, D] = tour.players;
    const matchIds = [
      `${tour.id}-demi1`, // A vs B
      `${tour.id}-demi2`  // C vs D
    ];
    const pairs = [ [A, B], [C, D] ];
    tour.winners = [];

    pairs.forEach(([p1, p2], idx) => {
      const matchId = matchIds[idx];
      const s1 = ns.sockets.get(p1.id)!;
      const s2 = ns.sockets.get(p2.id)!;
      s1.join(matchId);
      s2.join(matchId);
      playerInfo.set(p1.id, { side: 0, mode: 'multi', roomId: matchId });
      playerInfo.set(p2.id, { side: 1, mode: 'multi', roomId: matchId });
      s1.emit('tournamentMatchFound', { matchId, side: 0, opponent: p2.username });
      s2.emit('tournamentMatchFound', { matchId, side: 1, opponent: p1.username });
      const state = startMatch([s1, s2], ns, false, matchId); // <-- PATCH: matchId comme roomId
      matchStates.set(matchId, state);
      const iv = setInterval(() => {
        updateMatch(state, ns);
        ns.to(matchId).emit('gameState', state);
        if (state.gameOver) {
          clearInterval(iv);
          const winSide = state.paddles.findIndex(pl => pl.lives > 0);
          const winner = winSide === 0 ? p1 : p2;
          tour.winners.push(winner);
          ns.to(matchId).emit('tournamentMatchOver', {
            tournamentId: tour.id,
            matchId,
            winner: winner.username,
            loser: winSide === 0 ? p2.username : p1.username
          });
          // Quand les deux gagnants sont connus, lancer la finale
          if (tour.winners.length === 2) {
            launchFinal4(ns, {
              id: tour.id,
              players: tour.winners,
              ready: new Map(tour.winners.map(p => [p.id, false])),
              round: 1,
              matches: {},
              finalists: tour.winners,
              finalReady: new Map(tour.winners.map(p => [p.id, false])),
              champion: undefined,
              allPlayers: tour.allPlayers // Ajouté pour respecter l'interface
            });
          }
        }
      }, 1000 / 60);
    });
  }

  function launchFinal4(ns: Namespace, tour: BasicTournament) {
  // Guard: only launch if not already launched and both finalists are present
  if (tour.finalLaunched) return;
  if (!tour.finalists || tour.finalists.length !== 2) return;
  tour.finalLaunched = true;
  const [G1, G2] = tour.finalists;
  const matchId = `${tour.id}-final`;
  const s1 = ns.sockets.get(G1.id)!;
  const s2 = ns.sockets.get(G2.id)!;
  s1.join(matchId);
  s2.join(matchId);
  playerInfo.set(G1.id, { side: 0, mode: 'multi', roomId: matchId });
  playerInfo.set(G2.id, { side: 1, mode: 'multi', roomId: matchId });
  s1.emit('tournamentMatchFound', { matchId, side: 0, opponent: G2.username });
  s2.emit('tournamentMatchFound', { matchId, side: 1, opponent: G1.username });

  // Emit to eliminated players so they can spectate the final
  tour.allPlayers.forEach(p => {
    if (p.id !== G1.id && p.id !== G2.id) {
      const sock = ns.sockets.get(p.id);
      if (sock) {
        sock.join(matchId); // join the final room for spectating
        sock.emit('tournamentFinalSpectate', {
          matchId,
          finalists: [G1.username, G2.username]
        });
      }
    }
  });

  const state = startMatch([s1, s2], ns, false, matchId);
  matchStates.set(matchId, state);

  // 5) Boucle d'update
  const iv = setInterval(() => {
    updateMatch(state, ns);
    ns.to(matchId).emit('gameState', state);
    if (state.gameOver) {
      clearInterval(iv);
      const winSide = state.paddles.findIndex(pl => pl.lives > 0);
      const winner = winSide === 0 ? G1 : G2;
      const loser = winSide === 0 ? G2 : G1;

      // Enregistre le résultat de la finale dans tour.matches
      if (tour.matches[matchId]) {
        tour.matches[matchId].winner = winner;
      } else {
        tour.matches[matchId] = { players: [G1, G2], winner };
      }

      // Recalcule le status pour tous les joueurs (winner/eliminated)
      const allMatchesLocal = Object.values(tour.matches) as { players: [Player, Player], winner?: Player }[];
      const status = tour.allPlayers.map((p: Player) => {
        // Pour la finale, le perdant doit être marqué eliminated: true
        if (p.id === loser.id) {
          return {
            id: p.id,
            username: p.username,
            ready: false,
            eliminated: true
          };
        } else if (p.id === winner.id) {
          return {
            id: p.id,
            username: p.username,
            ready: false,
            eliminated: false
          };
        } else {
          // Pour les autres, on garde la logique précédente
          const m = allMatchesLocal.find(m2 => m2.players.some(pl => pl.id === p.id));
          const eliminated = m?.winner ? (m.winner.id !== p.id) : false;
          return {
            id: p.id,
            username: p.username,
            ready: false,
            eliminated: eliminated
          };
        }
      });
      gameNs.to(`tour-${tour.id}`).emit('tournamentBracket', {
        tournamentId: tour.id,
        size: 4,
        joined: tour.allPlayers.map((p: Player) => p.username),
        status: status
      });

      // Informer les joueurs du résultat de la finale
      ns.to(matchId).emit('tournamentMatchOver', {
        tournamentId: tour.id,
        matchId,
        winner: winner.username,
        loser: loser.username
      });

      // Puis annoncer la fin du tournoi
      ns.to(`tour-${tour.id}`).emit('tournamentOver', { winner: winner.username });
      // Ajout : message chat global avec médaille d'or
      sendTournamentChatMessage(`🥇 ${winner.username} remporte le tournoi Pong !`);
      tournaments.delete(tour.id);
    }
  }, 1000 / 60);
}

  
  // Nouvelle logique de tournoi à 8 joueurs (quart, demi, finale)
  function launchTournament8(ns: Namespace, tour: Tournament) {
    // 1er tour : 4 matchs (quart de finale)
    const matchIds = [0,1,2,3].map(i => `${tour.id}-r0-m${i}`);
    const pairs = [
      [tour.players[0], tour.players[1]],
      [tour.players[2], tour.players[3]],
      [tour.players[4], tour.players[5]],
      [tour.players[6], tour.players[7]],
    ];
    tour.winners = [];
    let round = 0;
    let winnersThisRound: Player[] = [];

    function playRound(pairs: Array<[Player, Player]>, round: number) {
      let finished = 0;
      winnersThisRound = [];
      pairs.forEach(([p1, p2], idx) => {
        const matchId = `${tour.id}-r${round}-m${idx}`;
        const s1 = ns.sockets.get(p1.id)!;
        const s2 = ns.sockets.get(p2.id)!;
        s1.join(matchId);
        s2.join(matchId);
        playerInfo.set(p1.id, { side: 0, mode: 'multi', roomId: matchId });
        playerInfo.set(p2.id, { side: 1, mode: 'multi', roomId: matchId });
        s1.emit('tournamentMatchFound', { matchId, side: 0, opponent: p2.username });
        s2.emit('tournamentMatchFound', { matchId, side: 1, opponent: p1.username });
        const state = startMatch([s1, s2], ns, false);
        matchStates.set(matchId, state);
        const iv = setInterval(() => {
          updateMatch(state, ns);
          ns.to(matchId).emit('gameState', state);
          if (state.gameOver) {
            clearInterval(iv);
            const winSide = state.paddles.findIndex(pl => pl.lives > 0);
            const winner = winSide === 0 ? p1 : p2;
            winnersThisRound.push(winner);
            ns.to(matchId).emit('tournamentMatchOver', {
              tournamentId: tour.id,
              matchId,
              winner: winner.username,
              loser: winSide === 0 ? p2.username : p1.username
            });
            finished++;
            if (finished === pairs.length) {
              if (pairs.length === 4) {
                // Passer aux demi-finales
                playRound([
                  [winnersThisRound[0], winnersThisRound[1]],
                  [winnersThisRound[2], winnersThisRound[3]]
                ], round + 1);
              } else if (pairs.length === 2) {
                // Passer à la finale
                playRound([[winnersThisRound[0], winnersThisRound[1]]], round + 1);
              } else if (pairs.length === 1) {
                // Tournoi terminé
                const champion = winnersThisRound[0];
                ns.to(matchId).emit('tournamentMatchOver', {
                  tournamentId: tour.id,
                  matchId,
                  winner: champion.username,
                  loser: ""
                });
                ns.to(`tour-${tour.id}`).emit('tournamentOver', {
                  winner: champion.username
                });
                tournaments.delete(tour.id);
              }
            }
          }
        }, 1000 / 60);
      });
    }
    tour.playRound = playRound;
    playRound(pairs as [Player, Player][], 0);
  }
  


  // --- FONCTION D'ASSOCIATION POUR 3-JOUEURS TRI-PONG ---
  function attemptTriMatch() {
    while (triQueue.length >= 3) {
      const trio = triQueue.slice(0, 3);
      const userIds = trio.map(p => getUserIdFromSocketId(p.id) || p.id);
      // Vérifie qu'il n'y a pas de doublon userId
      const uniqueUserIds = new Set(userIds);
      if (uniqueUserIds.size < 3) {
        // Trouve l'index du doublon (le 2e ou 3e)
        let idxToRemove = 1;
        if (userIds[1] === userIds[0]) idxToRemove = 1;
        else if (userIds[2] === userIds[0] || userIds[2] === userIds[1]) idxToRemove = 2;
        const removed = triQueue.splice(idxToRemove, 1)[0];
        const sock = gameNs.sockets.get(removed.id);
        if (sock) sock.emit('error', { message: 'Tournoi bloqué : multi-fenêtre ou double connexion détectée.' });
        continue;
      }
      // Pas de doublon, on lance le match
      triQueue.splice(0, 3);
      const socks = trio.map(p => gameNs.sockets.get(p.id)!).filter(Boolean);
      const m = startTriMatch(socks, gameNs, false);
      triMatchStates.set(m.roomId, m);
      const players = trio.map(p => p.username);
      socks.forEach((s, i) => {
        playerInfo.set(s.id, { side: i, mode: 'tri' });
        s.join(m.roomId);
        s.emit('matchFoundTri', { roomId: m.roomId, side: i, players, mode:'multi' });
      });
      const iv = setInterval(() => {
        updateMatch(m, gameNs);
        gameNs.to(m.roomId).emit('gameState', m);
        if (m.gameOver) clearInterval(iv);
      }, 1000 / 60);
    }
  }
}