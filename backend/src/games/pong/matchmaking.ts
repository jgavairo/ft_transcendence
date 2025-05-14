// matchmaking.ts
import type { Namespace, Socket } from 'socket.io';
import { startMatch, updateMatch, MatchState } from './gameSimulation.js';
import { startTriMatch, TriMatchState } from './TripongSimulation.js';
import { dbManager } from '../../database/database.js';

interface PlayerInfo {
  side: number;               // 0|1 pour bi-pong, 0|1|2 pour tri-pong, -1 pour solo modes
  mode: 'solo' | 'multi' | 'tri' | 'solo-tri';
}
interface Player { id: string; username: string; }

export function setupGameMatchmaking(gameNs: Namespace) {
  const playerInfo = new Map<string, PlayerInfo>();
  // Nouvelle Map pour stocker l'association socket_id -> user_id
  const socketToUserId = new Map<string, string>();
  let classicQueue: Player[] = [];
  let triQueue: Player[] = [];
  const matchStates = new Map<string, MatchState>();
  const triMatchStates = new Map<string, TriMatchState>();

  // Fonction utilitaire pour récupérer l'ID utilisateur à partir d'un socket_id
  function getUserIdFromSocketId(socketId: string): string | undefined {
    return socketToUserId.get(socketId);
  }

  gameNs.on('connection', socket => {
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
      playerInfo.delete(socket.id);
      socketToUserId.delete(socket.id); // Supprimer l'association lors de la déconnexion
      classicQueue = classicQueue.filter(p => p.id !== socket.id);
      triQueue     = triQueue.filter(p => p.id !== socket.id);
    });
  });

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

