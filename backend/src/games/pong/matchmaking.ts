// matchmaking.ts
import type { Namespace, Socket } from 'socket.io';
import { startMatch, updateMatch, MatchState } from './gameSimulation.js';
import { startTriMatch, TriMatchState } from './TripongSimulation.js';
import { dbManager } from '../../database/database.js';

interface PlayerInfo {
  side: number;               // 0|1 pour bi-pong, 0|1|2 pour tri-pong, -1 pour solo modes
  mode: 'solo' | 'multi' | 'tri' | 'solo-tri';
  roomId?: string;
}

interface Player { id: string; username: string; }

interface Tournament {
  id: string;
  size: 4|8;
  players: Player[];     // liste des joueurs du round en cours
  round: number;         // 0 = 1er tour, 1 = finale
  winners: Player[];     // joueurs qualifiés pour le round suivant
  readyIds: string[]; 
}

export function setupGameMatchmaking(gameNs: Namespace) {
  const playerInfo = new Map<string, PlayerInfo>();
  // Nouvelle Map pour stocker l'association socket_id -> user_id
  const socketToUserId = new Map<string, string>();
  let classicQueue: Player[] = [];
  let triQueue: Player[] = [];
  const matchStates = new Map<string, MatchState>();
  const triMatchStates = new Map<string, TriMatchState>();
  // Map des tournois complets ou en attente, groupés par id
  const tournaments = new Map<string, Tournament>();
  const tournamentQueues: { [k in 4|8]: Player[] } = { 4: [], 8: [] };

  // Gestion des rooms privées
  const privateRooms = new Map<string, { sockets: Socket[]; usernames: string[]; maxPlayers: number }>();

  // Fonction utilitaire pour récupérer l'ID utilisateur à partir d'un socket_id
  function getUserIdFromSocketId(socketId: string): string | undefined {
    return socketToUserId.get(socketId);
  }

  gameNs.on('connection', socket => {
    
    // TOURNAMENT
    socket.on('joinTournamentQueue', async ({ size, username, userId }: { size: 4 | 8; username: string; userId?: string }) => {
      // stocker userId si existant
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      // FIFO push
      const q = tournamentQueues[size];
      if (!q.find(p => p.id === socket.id)) {
        q.push({ id: socket.id, username });
      }

      // placeholder : informer les inscrits
      const joined = q.map(p => p.username);
      q.forEach(p => gameNs.sockets.get(p.id)
        ?.emit('tournamentBracket', { size, joined })
      );

      // 2) dès que la queue atteint la taille, on crée un tournoi
      if (q.length === size) {
        const tour: Tournament = {
          id: crypto.randomUUID(),
          size,
          players: q.slice(),  // copie de la file
          round: 0,
          winners: [],
          readyIds: []
        };
        tournaments.set(tour.id, tour);
        tournamentQueues[size] = [];  // vider la queue

        startRound(gameNs, tour);
      }
    });

    socket.on('playerReady', ({ matchId }: { matchId: string }) => {
      // retrouver le tournoi
      const tourId = matchId.split('-r')[0];
      const tour = tournaments.get(tourId);
      if (!tour) return;
    
      // marquer ce joueur comme prêt
      if (!tour.readyIds.includes(socket.id)) {
        tour.readyIds.push(socket.id);
      }
    
      // si les deux sont prêts → on lance la finale
      if (tour.readyIds.length === 2) {
        launchMatches(gameNs, tour);
      }
    });

    // 1) SOLO CLASSIC
    socket.on('startSolo', ({ username, userId }: { username: string, userId?: string }) => {
      // Stocker l'association socket_id -> user_id si disponible
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

    // 2) SOLO TRI-PONG
    socket.on('startSoloTri', ({ username, userId }: { username: string, userId?: string }) => {
      // Stocker l'association socket_id -> user_id si disponible
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

    // 3) 2-JOUEURS MATCHMAKING
    socket.on('joinQueue', ({ username, userId }: { username: string, userId?: string }) => {
      // Stocker l'association socket_id -> user_id si disponible
      if (userId) {
        socketToUserId.set(socket.id, userId);
      }
      
      if (!classicQueue.some(p => p.id === socket.id)) {
        classicQueue.push({ id: socket.id, username });
      }
      if (classicQueue.length >= 2) {
        const p1 = classicQueue.shift()!;
        const p2 = classicQueue.shift()!;
        const s1 = gameNs.sockets.get(p1.id)!;
        const s2 = gameNs.sockets.get(p2.id)!;
        const m = startMatch([s1, s2], gameNs, false);

        matchStates.set(m.roomId, m);
        playerInfo.set(p1.id, { side: 0, mode: 'multi' });
        playerInfo.set(p2.id, { side: 1, mode: 'multi' });

        s1.join(m.roomId);
        s2.join(m.roomId);

        // Inclure les IDs des joueurs dans l'événement `matchFound`
        s1.emit('matchFound', {
          roomId: m.roomId,
          side: 0,
          mode: 'multi',
          you: p1.username,
          opponent: p2.username,
          user1Id: getUserIdFromSocketId(p1.id) || p1.id, // ID du joueur 1
          user2Id: getUserIdFromSocketId(p2.id) || p2.id  // ID du joueur 2
        });

        s2.emit('matchFound', {
          roomId: m.roomId,
          side: 1,
          mode: 'multi',
          you: p2.username,
          opponent: p1.username,
          user1Id: getUserIdFromSocketId(p1.id) || p1.id, // ID du joueur 1
          user2Id: getUserIdFromSocketId(p2.id) || p2.id  // ID du joueur 2
        });

        const iv = setInterval(() => {
          updateMatch(m, gameNs);
          gameNs.to(m.roomId).emit('gameState', m);
          if (m.gameOver) clearInterval(iv);
        }, 1000 / 60);
      }
    });

    // 4) GESTION DES DÉPLACEMENTS PADDLE BI-PONG
    socket.on('movePaddle', (data: { side: 0|1, direction: 'up'|'down'|null }) => {
      const info = playerInfo.get(socket.id);
      if (!info) return;

      // on accepte le move en solo **et** en multi, tant que c'est notre socket
      if ((info.mode === 'multi' && info.side !== data.side) || (info.mode !== 'multi' && info.mode !== 'solo')) {
        return;
      }
      const roomId = [...socket.rooms].find(r => r !== socket.id);
      if (!roomId) return;
      const m = matchStates.get(roomId);
      if (!m) return;
      // on bouge seulement *celui* qu'on nous a demandé
      m.paddles[data.side].direction = data.direction;
    });

    // 5) 3-JOUEURS TRIPONG MATCHMAKING
    socket.on('joinTriQueue', ({ username, userId }: { username: string, userId?: string }) => {
      // Stocker l'association socket_id -> user_id si disponible
      if (userId) {
        socketToUserId.set(socket.id, userId);
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

    // Nouvel événement pour récupérer l'ID utilisateur à partir d'un socket_id
    socket.on('getUserIdFromSocketId', (data: { socketId: string }, callback: (userId: string | null) => void) => {
      const userId = getUserIdFromSocketId(data.socketId);
      callback(userId || null);
    });

    // 6) DÉCONNEXION
    socket.on('disconnect', () => {
      classicQueue = classicQueue.filter(p => p.id !== socket.id);
      triQueue     = triQueue.filter(p => p.id !== socket.id);
    });

    // --- ROOM PRIVÉE ---
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
      // Si la room est pleine, on lance la partie
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
  });

  // 1) Lancement du tournoi
  function startRound(ns: Namespace, tour: Tournament) {
    const p = tour.players;
    tour.winners = [];
    tour.readyIds = [];

    if (tour.round > 0) {
      // il ne reste que 2 joueurs
      tour.players.forEach(p => {
        // envoie un événement qui dit “prêt pour le match ?”
        const s = gameNs.sockets.get(p.id);
        if (s) s.emit('readyForMatch', {
          matchId: `${tour.id}-r${tour.round}-final`,
          opponent: tour.players.find(o => o.id !== p.id)!.username
        });
      });
      return;
    }

    launchMatches(ns, tour);
  }
  function launchMatches(ns: Namespace, tour: Tournament) {
    const p = tour.players;
    const isFinal = tour.round > 0;
    tour.winners = [];

    for (let i = 0; i < p.length; i += 2) {
      const A = p[i], B = p[i+1];
      const matchId = `${tour.id}-r${tour.round}-m${i/2}`;

      // les deux viennent dans la room
      const sA = ns.sockets.get(A.id)!;
      const sB = ns.sockets.get(B.id)!;
      
      
      const prevRoomA = playerInfo.get(A.id)?.roomId;
      if (prevRoomA) sA.leave(prevRoomA);
      const prevRoomB = playerInfo.get(B.id)?.roomId;
      if (prevRoomB) sB.leave(prevRoomB);

      // notifie
      
      playerInfo.set(A.id, { side: 0, mode: 'multi', roomId: matchId });
      playerInfo.set(B.id, { side: 1, mode: 'multi', roomId: matchId });
      
      sA.join(matchId); sB.join(matchId);
      const oppUserId = getUserIdFromSocketId(B.id) || B.id;
      const youUserId = getUserIdFromSocketId(A.id) || A.id;
      sA.emit('tournamentMatchFound', {
        matchId,
        side: 0,
        you:      A.username,
        youId:    youUserId,
        opponent: B.username,
        oppId:    oppUserId
      });
      // pour B
      sB.emit('tournamentMatchFound', {
        matchId,
        side: 1,
        you:      B.username,
        youId:    oppUserId,
        opponent: A.username,
        oppId:    youUserId
      });
      
      // démarre la sim
      const state = startMatch([sA, sB], ns, false);
      matchStates.set(matchId, state);

      const iv = setInterval(() => {
        updateMatch(state, ns);
        ns.to(matchId).emit('gameState', state);
        if (state.gameOver) {
          clearInterval(iv);

          // détermination du gagnant
          const winSide = state.paddles.findIndex(pl => pl.lives > 0);
          const winner = winSide === 0 ? A : B;
          tour.winners.push(winner);

          // si tous les matchs du round sont finis
          if (tour.winners.length === p.length / 2) {
            const totalRounds = Math.log2(tour.size);
            if (tour.round + 1 < totalRounds) {
              tour.round++;
              tour.players = tour.winners.slice();  // next round players
              startRound(ns, tour);
            } else {
              // tournoi terminé
              ns.to(`tour-${tour.id}`)
                .emit('tournamentOver', { winner: winner.username });
              tournaments.delete(tour.id);
            }
          }
        }
      }, 1000 / 60);
    }
  }



  // --- FONCTION D'ASSOCIATION POUR 3-JOUEURS TRI-PONG ---
  function attemptTriMatch() {
    while (triQueue.length >= 3) {
      const trio = triQueue.splice(0, 3);
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

