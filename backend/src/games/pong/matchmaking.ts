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
  semiLaunched?: boolean; // NEW: guard to prevent double-launch of semis
  semiWinners?: Player[]; // NEW: for 4-player tournaments, track semi-final winners
}

// Private rooms management
export const privateRooms = new Map<string, { sockets: Socket[]; usernames: string[]; maxPlayers: number }>();

export function setupGameMatchmaking(gameNs: Namespace, io: import('socket.io').Server) {
  const playerInfo = new Map<string, PlayerInfo>();
  // New Map to store the user ID to find later
  const socketToUserId = new Map<string, string>();
  // Fonction utilitaire pour obtenir tous les socketId d'un userId
  function getAllSocketIdsForUser(userId: string): string[] {
    return [...socketToUserId.entries()].filter(([_, uid]) => uid === userId).map(([sid]) => sid);
  }
  let classicQueue: Player[] = [];
  let triQueue: Player[] = [];
  const matchStates = new Map<string, MatchState>();
  const triMatchStates = new Map<string, TriMatchState>();
  // Ajout : Maps pour stocker les intervalles des parties classiques et tri-pong
  const matchIntervals = new Map<string, NodeJS.Timeout>();
  const triMatchIntervals = new Map<string, NodeJS.Timeout>();
  // Map of complete or pending tournaments, grouped by id
  // Store BasicTournament for the 4-player tournament
  const tournaments = new Map<string, BasicTournament>();
  const tournamentQueues: { [k in 4]: Player[] } = { 4: [] };

  // Map to store the intervals of each tournament match
  const tournamentMatchIntervals = new Map<string, NodeJS.Timeout>();

  // Ajout: Map pour stocker les timers d'auto-ready
  const tournamentAutoReadyTimers = new Map<string, NodeJS.Timeout>();

  // Utility function to get the user ID from a socket_id
  function getUserIdFromSocketId(socketId: string): string | undefined {
    return socketToUserId.get(socketId);
  }

  // Utility function to send a system message in the global chat
  async function sendTournamentChatMessage(content: string) {
    try {
      const chatNs = io.of('/chat');
      chatNs.emit('receiveMessage', {
        author: 'BOT', // 0 or "System" to indicate a system message
        content,
        timestamp: new Date().toISOString()
      });
      // Add: save the message in the history
      await dbManager.saveMessage(0, content);
    } catch (e) {
      console.error('[TOURNOI] Impossible d\'envoyer le message chat tournoi:', e);
    }
  }

  // Vérifie si un userId est dans la file d'attente d'un tournoi (avant lancement)
  function isUserInTournamentQueue(userId: string, size: 4): boolean {
    return tournamentQueues[4].some((p: Player) => socketToUserId.get(p.id) === userId);
  }

  gameNs.on('connection', socket => {
    
    // TOURNAMENT
    socket.on( 'joinTournamentQueue', async ({ username, userId }: { username: string, userId?: string }) => {
    
    // Toujours supprimer l'ancien mapping pour ce socket.id
    socketToUserId.delete(socket.id);
    
    // NOUVEAU: Nettoyage préventif des anciens sockets de cet userId
    if (userId) {
      const oldSocketIds = getAllSocketIdsForUser(userId);
      // Supprimer les anciens sockets déconnectés de cet userId
      oldSocketIds.forEach(oldSid => {
        if (!gameNs.sockets.has(oldSid)) {
          socketToUserId.delete(oldSid);
          // Aussi nettoyer les queues
          tournamentQueues[4] = tournamentQueues[4].filter(p => p.id !== oldSid);
        } else if (oldSid !== socket.id) {
          // Socket encore connecté mais différent du socket actuel
        }
      });
    }
    
    // Clean up: remove any queue entries with disconnected sockets only
    let q = tournamentQueues[4];
    const beforeCleanup = q.length;
    // Remove disconnected sockets
    q = q.filter(p => gameNs.sockets.has(p.id));
    // Remove ghost userId (same userId, but socket not present)
    if (userId) {
      q = q.filter(p => {
        const pUserId = socketToUserId.get(p.id);
        // If this is a ghost (same userId, but socket not present), remove
        if (pUserId === userId && !gameNs.sockets.has(p.id)) return false;
        return true;
      });
    }
    tournamentQueues[4] = q;
    if (beforeCleanup !== tournamentQueues[4].length) {
      tournamentQueues[4].forEach(p =>
        gameNs.sockets.get(p.id)?.emit('tournamentBracket', {
          size: 4,
          joined: tournamentQueues[4].map(p2 => p2.username),
          status: tournamentQueues[4].map(p2 => ({
            id: p2.id,
            username: p2.username,
            ready: false,
            eliminated: false,
            isInGame: false
          }))
        })
      );
    }
    
    // Blocage anti-doublon userId AVANT ajout à la file
    const userIdsInQueue = tournamentQueues[4]
    .map(p => socketToUserId.get(p.id))
    .filter(uid => uid !== undefined);

    // // 🛑 Vérification stricte : userId déjà en attente ?
    if (userId && userIdsInQueue.includes(userId)) {
      socket.emit('error', { message: 'Tournoi bloqué : multi-fenêtre ou double connexion détectée.' });
      return;
    }
    
    // ✅ Pas de doublon détecté, on peut ajouter l'utilisateur
    if (userId) socketToUserId.set(socket.id, userId);
    if (!tournamentQueues[4].find(p => p.id === socket.id)) {
      tournamentQueues[4].push({ id: socket.id, username });
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
            isInGame: false // Personne n'est in game tant que le tournoi n'a pas commencé
          }))
        })
    );
  
    // Dès que la file est pleine, créer et lancer le tournoi
    if (q.length === 4) {
      // Vérifie qu'il n'y a pas de doublon userId dans les 4 joueurs
      const userIds = q.map(p => (p.id && socketToUserId.get(p.id)) || p.id);
      const uniqueUserIds = new Set(userIds);
      if (uniqueUserIds.size < 4) {
        // Trouve l'index du doublon (le 2e, 3e ou 4e)
        let idxToRemove = 1;
        if (userIds[1] === userIds[0]) idxToRemove = 1;
        else if (userIds[2] === userIds[0] || userIds[2] === userIds[1]) idxToRemove = 2;
        else idxToRemove = 3;
        const removed = q.splice(idxToRemove, 1)[0];
        const sock = gameNs.sockets.get(removed.id);
        if (sock) sock.emit('error', { message: 'Tournoi bloqué : multi-fenêtre ou double connexion détectée.' });
        // On ne lance pas le tournoi, on attend un vrai 4e joueur
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
        allPlayers: q.slice() // Ajouté ici
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

      // --- AUTO-READY TIMER ---
      if (tournamentAutoReadyTimers.has(tour.id)) {
        clearTimeout(tournamentAutoReadyTimers.get(tour.id)!);
      }
      tournamentAutoReadyTimers.set(tour.id, setTimeout(() => {
        const t = tournaments.get(tour.id) as BasicTournament;
        if (!t) return; // <-- Fix: stop if tournament was deleted
        // Met tous les joueurs ready
        t.ready = new Map(t.players.map(p => [p.id, true]));
        gameNs.to(`tour-${t.id}`).emit('tournamentReadyUpdate', {
          tournamentId: t.id,
          size: 4,
          joined: t.allPlayers.map((p: Player) => p.username),
          status: t.allPlayers.map((p: Player) => ({
            id: p.id,
            username: p.username,
            ready: true,
            eliminated: false,
            isInGame: false
          }))
        });
        // Launch semi-finals only if not already launched
        launchTournament4(gameNs, t);
        tournamentAutoReadyTimers.delete(t.id);
      }, 60000));
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
            // Launch the two semi-finals only if not already launched
            launchTournament4(gameNs, tour);
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
              isInGame: false // Personne n'est en game tant que la finale n'est pas lancée
            }))
          });
          // Si les deux sont prêts, clear le timer et lance la finale
          if ([...tour.finalReady.values()].every((v: boolean) => v) && !tour.finalLaunched) {
            if (tournamentAutoReadyTimers.has(tour.id + '-final')) {
              clearTimeout(tournamentAutoReadyTimers.get(tour.id + '-final'));
              tournamentAutoReadyTimers.delete(tour.id + '-final');
            }
            launchFinal4(gameNs, tour);
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
            // --- AUTO-READY TIMER POUR LA FINALE ---
            if (tournamentAutoReadyTimers.has(tour.id + '-final')) {
              clearTimeout(tournamentAutoReadyTimers.get(tour.id + '-final'));
            }
            tournamentAutoReadyTimers.set(tour.id + '-final', setTimeout(() => {
              const t = tournaments.get(tour.id) as BasicTournament;
              if (!t || t.finalLaunched) return;
              // Met les deux finalistes ready
              t.finalReady = new Map(t.finalists.map(p => [p.id, true]));
              gameNs.to(`tour-${t.id}`).emit('tournamentReadyUpdate', {
                tournamentId: t.id,
                size: 4,
                joined: t.finalists.map((p: Player) => p.username),
                status: t.finalists.map((p: Player) => ({
                  id: p.id,
                  username: p.username,
                  ready: true,
                  eliminated: false,
                  isInGame: false
                }))
              });
              // Lance la finale si pas déjà fait
              if ([...t.finalReady.values()].every((v: boolean) => v) && !t.finalLaunched) {
                launchFinal4(gameNs, t);
              }
              tournamentAutoReadyTimers.delete(t.id + '-final');
            }, 60000));
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
          matchIntervals.delete(m.roomId);
        }
      }, 1000 / 60);
      matchIntervals.set(m.roomId, iv);
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
      matchIntervals.set(m.roomId, iv);
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
      triMatchIntervals.set(m.roomId, iv);
    });

    // 3) 2-PLAYERS MATCHMAKING
    socket.on('joinQueue', ({ username, userId }: { username: string, userId?: string }) => {
    // 1) On stocke l'association socketId → userId
    if (userId) {
      socketToUserId.set(socket.id, userId);
    }

    // 2) CLEANUP : on enlève les sockets déconnectés et les "fantômes" du même userId
    classicQueue = classicQueue.filter(p => {
      // a) socket toujours connectée ?
      if (!gameNs.sockets.has(p.id)) return false;
      // b) pas un fantôme pour ce même userId ?
      const pUid = getUserIdFromSocketId(p.id);
      if (userId && pUid === userId) return false;
      return true;
    });

    // 3) Blocage anti-doublon userId AVANT ajout à la file
    const userIdsInQueue = classicQueue.map(p => getUserIdFromSocketId(p.id) || p.id);
    if (userId && userIdsInQueue.includes(userId)) {
      socket.emit('error', { message: 'account already connected on a matchmaking' });
      return;
    }

    // 4) Vérification qu'on n'est pas déjà en multi-partie
    const currentInfo = playerInfo.get(socket.id);
    if (currentInfo && currentInfo.mode === 'multi') {
      socket.emit('error', { message: 'Vous êtes déjà dans une partie en cours' });
      return;
    }

    // 5) On ajoute à la queue si ce socket n'y est pas déjà
    if (!classicQueue.some(p => p.id === socket.id)) {
      classicQueue.push({ id: socket.id, username });
    }

    // 6) Tant qu'on a au moins 2 joueurs valides, on essaye de matcher
    while (classicQueue.length >= 2) {
      const p1 = classicQueue[0];
      const p2 = classicQueue[1];
      const userId1 = getUserIdFromSocketId(p1.id) || p1.id;
      const userId2 = getUserIdFromSocketId(p2.id) || p2.id;

      // si doublon userId, on vire le 2e et on continue
      if (userId1 === userId2) {
        const removed = classicQueue.splice(1, 1)[0];
        const sock = gameNs.sockets.get(removed.id);
        if (sock) {
          sock.emit('error', {
            message: 'Matchmaking bloqué : multi-fenêtre ou double connexion détectée.'
          });
        }
        continue;
      }

      // sinon on peut matcher ces deux-là
      classicQueue.shift();
      classicQueue.shift();
      const s1 = gameNs.sockets.get(p1.id)!;
      const s2 = gameNs.sockets.get(p2.id)!;
      const m = startMatch([s1, s2], gameNs, false);

      // on enregistre l'état du match
      matchStates.set(m.roomId, m);
      playerInfo.set(p1.id, { side: 0, mode: 'multi' });
      playerInfo.set(p2.id, { side: 1, mode: 'multi' });

      // on les fait rejoindre la room
      s1.join(m.roomId);
      s2.join(m.roomId);

      // on envoie l'événement matchFound avec userIds
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
      // boucle d'update
      const iv = setInterval(async () => {
        updateMatch(m, gameNs);
        gameNs.to(m.roomId).emit('gameState', m);
        if (m.gameOver) {
          clearInterval(iv);
          // Ajout stats/historique PONG
          try {
            // On suppose que le gameId de Pong est 1 (à adapter si besoin)
            const pongGameId = 1;
            // Les vies sont dans m.paddles[0].lives et m.paddles[1].lives
            const user1IdNum = Number(userId1);
            const user2IdNum = Number(userId2);
            if (!isNaN(user1IdNum) && !isNaN(user2IdNum)) {
              await dbManager.addMatchToHistory(user1IdNum, user2IdNum, pongGameId, m.paddles[0].lives, m.paddles[1].lives);
              // Détermination du gagnant
              if (m.paddles[0].lives > m.paddles[1].lives) {
                await dbManager.incrementPlayerWins(pongGameId, user1IdNum);
                await dbManager.incrementPlayerLosses(pongGameId, user2IdNum);
              } else if (m.paddles[1].lives > m.paddles[0].lives) {
                await dbManager.incrementPlayerWins(pongGameId, user2IdNum);
                await dbManager.incrementPlayerLosses(pongGameId, user1IdNum);
              }
            }
          } catch (err) {
            console.error('[PONG] Erreur ajout stats/historique:', err);
          }
        }
      }, 1000 / 60);
      matchIntervals.set(m.roomId, iv);
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
      const userId = socketToUserId.get(socket.id);
      let socketIds: string[] = [socket.id];
      if (userId) {
        socketIds = getAllSocketIdsForUser(userId);
      }

      classicQueue = classicQueue.filter(p => !socketIds.includes(p.id));
      triQueue     = triQueue.filter(p => !socketIds.includes(p.id));
      tournamentQueues[4] = tournamentQueues[4].filter(p => !socketIds.includes(p.id));
      socketIds.forEach((sid: string) => {
        socketToUserId.delete(sid);
      });

      // --- Arrêt des intervalles gameState pour les rooms classiques ---
      for (const [roomId, m] of matchStates.entries()) {
        // On suppose que l'ordre des paddles correspond à l'ordre des sockets dans la room
        // On cherche si un des sockets déconnectés est dans la room (side 0 ou 1)
        const playerSocketIds = [
          ...playerInfo.entries()
        ].filter(([sid, info]) => info.roomId === roomId).map(([sid]) => sid);
        if (playerSocketIds.some(sid => socketIds.includes(sid))) {
          if (matchIntervals.has(roomId)) {
            clearInterval(matchIntervals.get(roomId));
            matchIntervals.delete(roomId);
          }
          matchStates.delete(roomId);
        }
      }
      // --- Idem pour les triMatchStates si besoin ---
      for (const [roomId, m] of triMatchStates.entries()) {
        const playerSocketIds = [
          ...playerInfo.entries()
        ].filter(([sid, info]) => info.roomId === roomId).map(([sid]) => sid);
        if (playerSocketIds.some(sid => socketIds.includes(sid))) {
          if (triMatchIntervals.has(roomId)) {
            clearInterval(triMatchIntervals.get(roomId));
            triMatchIntervals.delete(roomId);
          }
          triMatchStates.delete(roomId);
        }
      }
      // --- Pour les tournois, tu as déjà tournamentMatchIntervals ---
      for (const [matchId, interval] of tournamentMatchIntervals.entries()) {
        const state = matchStates.get(matchId);
        const playerSocketIds = [
          ...playerInfo.entries()
        ].filter(([sid, info]) => info.roomId === matchId).map(([sid]) => sid);
        if (playerSocketIds.some(sid => socketIds.includes(sid))) {
          clearInterval(interval);
          tournamentMatchIntervals.delete(matchId);
          matchStates.delete(matchId);
        }
      }
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
            if (m.gameOver) {
              clearInterval(iv);
              matchIntervals.delete(roomId);
            }
          }, 1000 / 60);
          matchIntervals.set(roomId, iv);
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
            if (m.gameOver) {
              clearInterval(iv);
              triMatchIntervals.delete(roomId);
            }
          }, 1000 / 60);
          triMatchIntervals.set(roomId, iv);
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
      const userId = socketToUserId.get(socket.id);


      // 🔹 Supprimer de la file d'attente du tournoi (queue 4)
      // Nettoyage plus agressif : supprimer TOUS les sockets liés à cet userId
      if (userId) {
        const allSocketsForUser = getAllSocketIdsForUser(userId);
        tournamentQueues[4] = tournamentQueues[4].filter(p => {
          const pUserId = socketToUserId.get(p.id);
          return !allSocketsForUser.includes(p.id) && pUserId !== userId;
        });
      } else {
        // Fallback si pas d'userId
        tournamentQueues[4] = tournamentQueues[4].filter(p => p.id !== socket.id);
      }

      // 🔹 Mise à jour de l'affichage des brackets pour les autres en attente
      const joined = tournamentQueues[4].map(p => p.username);
      const status = tournamentQueues[4].map(p => ({
        id: p.id,
        username: p.username,
        ready: false,
        eliminated: false,
        isInGame: false
      }));
      tournamentQueues[4].forEach(p =>
        gameNs.sockets.get(p.id)?.emit('tournamentBracket', { size: 4, joined, status })
      );

      // 🔹 On récupère le tournoi en cours (si encore en mémoire)
      const tour = tournaments.get(tournamentId) as BasicTournament | undefined;

      if (tour) {
        // 🔸 Nettoyage des joueurs
        tour.allPlayers = tour.allPlayers.filter(p => {
          const pUid = socketToUserId.get(p.id);
          return p.id !== socket.id && pUid !== userId;
        });
        tour.players = tour.players.filter(p => {
          const pUid = socketToUserId.get(p.id);
          return p.id !== socket.id && pUid !== userId;
        });

        // 🔸 Nettoyage des états de readiness
        socketToUserId.forEach((uid, sid) => {
          if (uid === userId || sid === socket.id) {
            tour.ready.delete(sid);
            tour.finalReady?.delete(sid);
          }
        });

        // 🔸 Mise à jour des matchs (victoires par forfait)
        Object.values(tour.matches).forEach(m => {
          if (!m.winner && m.players.some(p => {
            const pUid = socketToUserId.get(p.id);
            return p.id === socket.id || pUid === userId;
          })) {
            const survivor = m.players.find(p => {
              const pUid = socketToUserId.get(p.id);
              return p.id !== socket.id && pUid !== userId;
            })!;
            m.winner = survivor;
          }
          m.players = m.players.filter(p => {
            const pUid = socketToUserId.get(p.id);
            return p.id !== socket.id && pUid !== userId;
          }) as [Player, Player];
        });

        // 🔸 Fin du tournoi si un seul joueur reste
        if (tour.allPlayers.length === 1) {
          const champ = tour.allPlayers[0];
          gameNs.to(`tour-${tour.id}`).emit('tournamentOver', { winner: champ.username });
          tournaments.delete(tour.id);
        } else {
          // Sinon : mise à jour du bracket
          const joined = tour.allPlayers.map(p => p.username);
          const status = tour.allPlayers.map(p => {
            const inMatch = Object.values(tour.matches).find(m2 =>
              m2.players.some(pl => pl.id === p.id)
            );
            const eliminated = inMatch?.winner ? (inMatch.winner.id !== p.id) : false;
            let ready = false;
            if (tour.round === 0) ready = tour.ready.get(p.id) || false;
            else if (tour.round === 1 && tour.finalReady) ready = tour.finalReady.get(p.id) || false;
            let isInGame = false;
            if (inMatch && !inMatch.winner && !eliminated) isInGame = true;
            return {
              id: p.id,
              username: p.username,
              ready,
              eliminated,
              isInGame
            };
          });
          gameNs.to(`tour-${tour.id}`).emit('tournamentBracket', {
            tournamentId: tour.id,
            size: 4,
            joined,
            status
          });
        }
      } else {
        // 🔹 Si le tournoi est déjà supprimé : nettoyage minimal
        if (userId) {
          getAllSocketIdsForUser(userId).forEach(sid => socketToUserId.delete(sid));
        } else {
          socketToUserId.delete(socket.id);
        }
      }

      // 🔹 Nettoyage final - PLUS AGRESSIF
      // Supprimer TOUTES les entrées socketToUserId pour cet userId + ce socket spécifiquement
      if (userId) {
        const allSocketsForUser = getAllSocketIdsForUser(userId);
        allSocketsForUser.forEach(sid => {
          socketToUserId.delete(sid);
        });
      }
      
      // 🔹 IMPORTANT: Supprimer aussi ce socket spécifiquement de socketToUserId
      // même s'il reste connecté, car il a quitté le tournoi
      socketToUserId.delete(socket.id);

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
  function launchTournament4(ns: Namespace, tour: BasicTournament) {
    if (tour.semiLaunched) return;
    tour.semiLaunched = true;
    tour.round = 0;
    tour.semiWinners = [];
    const [A, B, C, D] = tour.players;
    const match1Id = `${tour.id}-demi1`;
    const match2Id = `${tour.id}-demi2`;
    tour.matches[match1Id] = { players: [A, B] };
    tour.matches[match2Id] = { players: [C, D] };
    const demiFinales: [Player, Player, string][] = [
      [A, B, match1Id],
      [C, D, match2Id]
    ];
    // --- Annule le timer d'auto-ready si présent (dès que la game démarre) ---
    if (tournamentAutoReadyTimers.has(tour.id)) {
      clearTimeout(tournamentAutoReadyTimers.get(tour.id)!);
      tournamentAutoReadyTimers.delete(tour.id);
    }
    for (const [p1, p2, matchId] of demiFinales) {
      const s1 = ns.sockets.get(p1.id)!;
      const s2 = ns.sockets.get(p2.id)!;
      s1.join(matchId);
      s2.join(matchId);
      playerInfo.set(p1.id, { side: 0, mode: 'multi', roomId: matchId });
      playerInfo.set(p2.id, { side: 1, mode: 'multi', roomId: matchId });
      s1.emit('tournamentMatchFound', { matchId, side: 0, opponent: p2.username });
      s2.emit('tournamentMatchFound', { matchId, side: 1, opponent: p1.username });
      const state = startMatch([s1, s2], ns, false, matchId);
      matchStates.set(matchId, state);
      const iv = setInterval(() => {
        updateMatch(state, ns);
        ns.to(matchId).emit('gameState', state);
        if (state.gameOver) {
          clearInterval(iv);
          const winSide = state.paddles.findIndex(pl => pl.lives > 0);
          const winner = winSide === 0 ? p1 : p2;
          ns.to(matchId).emit('tournamentMatchOver', {
            tournamentId: tour.id,
            matchId,
            winner: winner.username,
            loser: winSide === 0 ? p2.username : p1.username
          });
          // Track semi-final winners and launch final if both are known
          if (!tour.semiWinners) tour.semiWinners = [];
          tour.semiWinners.push(winner);
          if (tour.semiWinners.length === 2) {
            // Préparer la finale mais NE PAS la lancer ici !
            tour.finalists = tour.semiWinners.slice();
            tour.finalReady = new Map(tour.finalists.map(p => [p.id, false]));
            tour.finalLaunched = false;
            const finalMatchId = `${tour.id}-final`;
            tour.matches[finalMatchId] = { players: [tour.finalists[0], tour.finalists[1]] };
            // --- AUTO-READY TIMER POUR LA FINALE ---
            if (tournamentAutoReadyTimers.has(tour.id + '-final')) {
              clearTimeout(tournamentAutoReadyTimers.get(tour.id + '-final'));
            }
            tournamentAutoReadyTimers.set(tour.id + '-final', setTimeout(() => {
              const t = tournaments.get(tour.id) as BasicTournament;
              if (!t || t.finalLaunched) return;
              // Met les deux finalistes ready
              t.finalReady = new Map(t.finalists.map(p => [p.id, true]));
              gameNs.to(`tour-${t.id}`).emit('tournamentReadyUpdate', {
                tournamentId: t.id,
                size: 4,
                joined: t.finalists.map((p: Player) => p.username),
                status: t.finalists.map((p: Player) => ({
                  id: p.id,
                  username: p.username,
                  ready: true,
                  eliminated: false,
                  isInGame: false
                }))
              });
              // Lance la finale si pas déjà fait
              if ([...t.finalReady.values()].every((v: boolean) => v) && !t.finalLaunched) {
                launchFinal4(gameNs, t);
              }
              tournamentAutoReadyTimers.delete(t.id + '-final');
            }, 60000));
          }
        }
      }, 1000 / 60);
    }
    // Announce the semi-finals in the chat
    const now = new Date();
    const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg = `[TOURNOI PONG] Demi-finales (${heure}) :\nMatch 1 : @${A.username} vs @${B.username}\nMatch 2 : @${C.username} vs @${D.username}`;
    sendTournamentChatMessage(msg);
  }

  function launchFinal4(ns: Namespace, tour: BasicTournament) {
  // Guard: only launch if not already launched and both finalists are present
  if (tour.finalLaunched) return;
  if (!tour.finalists || tour.finalists.length !== 2) return;
  tour.finalLaunched = true;
  // --- Annule le timer d'auto-ready de la finale si présent ---
  if (tournamentAutoReadyTimers.has(tour.id + '-final')) {
    clearTimeout(tournamentAutoReadyTimers.get(tour.id + '-final'));
    tournamentAutoReadyTimers.delete(tour.id + '-final');
  }
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

  // Announce the final in the chat
  const now = new Date();
  const heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const msg = `[TOURNOI PONG] Finale (${heure}) : @${G1.username} vs @${G2.username}`;
  sendTournamentChatMessage(msg);

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
      triMatchIntervals.set(m.roomId, iv);
    }
  }
}