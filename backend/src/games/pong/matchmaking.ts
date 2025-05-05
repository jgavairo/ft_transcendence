import type { Namespace, Socket } from 'socket.io';
import { startMatch, MatchState } from './gameSimulation.js';
import { startTriMatch, updateTriMatch, TriMatchState } from './TripongSimulation.js';
import { dbManager } from '../../database/database.js';

interface PlayerInfo {
  side: number;               // 0=player1/left, 1=player2/right, 2=third arc
  mode: 'solo' | 'multi' | 'tri' | 'solo-tri';
}
interface Player { id: string; username: string; }

export function setupGameMatchmaking(gameNs: Namespace) {
  const playerInfo = new Map<string, PlayerInfo>();
  let classicQueue: Player[] = [];
  let triQueue: Player[] = [];
  const matchStates = new Map<string, MatchState>();
  const triMatchStates = new Map<string, TriMatchState>();

  gameNs.on('connection', (socket: Socket) => {
    // -----------------------------------------------------
    // 1) SOLO CLASSIC (1 joueur local)
    socket.on('startSolo', ({ username }: { username: string }) => {
      const match = startMatch(socket, socket, gameNs);
      matchStates.set(match.roomId, match);
      playerInfo.set(socket.id, { side: 0, mode: 'solo' });
      socket.emit('matchFound', {
        roomId: match.roomId,
        side: 0,
        mode: 'solo'
      });
    });

    // -----------------------------------------------------
    // 2) SOLO TRI-PONG (1 joueur pilote les 3 arcs)
    socket.on('startSoloTri', ({ username }: { username: string }) => {
      const match = startTriMatch([socket, socket, socket], gameNs);
      triMatchStates.set(match.roomId, match);
      playerInfo.set(socket.id, { side: -1, mode: 'solo-tri' });
      socket.join(match.roomId);
      socket.emit('matchFoundTri', {
        roomId: match.roomId,
        side: -1,       // special flag pour solo-tri
        players: [username, username, username]
      });

      // boucle serveur tri-pong
      const tick = setInterval(() => {
        const m = triMatchStates.get(match.roomId)!;
        updateTriMatch(m);
        gameNs.to(match.roomId).emit('stateUpdateTri', m);
        if (m.gameOver) clearInterval(tick);
      }, 1000 / 60);
    });

    // -----------------------------------------------------
    // 3) CLASSIC 2-JOUEURS MATCHMAKING
    socket.on('joinQueue', ({ username }: { username: string }) => {
      if (!classicQueue.some(p => p.id === socket.id)) {
        classicQueue.push({ id: socket.id, username });
        attemptClassicMatch();
      }
    });

    socket.on('movePaddle', (data: { paddle: 0 | 1; direction: 'up' | 'down' | null }) => {
      const info = playerInfo.get(socket.id);
      if (!info || info.mode !== 'multi') return;
      if (info.side !== data.paddle) return;
      const roomId = [...socket.rooms].find(r => r !== socket.id);
      if (!roomId) return;
      const m = matchStates.get(roomId);
      if (!m) return;
      if (data.paddle === 0) m.leftPaddleDirection  = data.direction;
      else                    m.rightPaddleDirection = data.direction;
    });

    // -----------------------------------------------------
    // 4) TRI-PONG 3-JOUEURS MATCHMAKING
    socket.on('joinTriQueue', ({ username }: { username: string }) => {
      if (!triQueue.some(p => p.id === socket.id)) {
        triQueue.push({ id: socket.id, username });
        attemptTriMatch();
      }
    });

    socket.on('movePaddleTri', (data: { side: number; direction: 'up'|'down'|null }) => {
      const info = playerInfo.get(socket.id);
      if (!info) return;
      // en ligne tri, on ne bouge que son arc
      if (info.mode === 'tri' && info.side !== data.side) return;
      // en solo-tri, on peut piloter tous
      if (info.mode !== 'tri' && info.mode !== 'solo-tri') return;
      const roomId = [...socket.rooms].find(r=>r!==socket.id);
      if (!roomId) return;
      const m = triMatchStates.get(roomId);
      if (!m) return;
      m.paddles[data.side].direction = data.direction;
    });

    // -----------------------------------------------------
    // 5) GARDE LES FILES PROPRES À LA DÉCONNEXION
    socket.on('disconnect', () => {
      playerInfo.delete(socket.id);
      classicQueue = classicQueue.filter(p => p.id !== socket.id);
      triQueue     = triQueue.filter(p => p.id !== socket.id);
    });
  });

  // ============================================
  // FONCTION D’ASSOCIATION POUR 2 JOUEURS
  async function attemptClassicMatch() {
    while (classicQueue.length >= 2) {
      const p1 = classicQueue.shift()!;
      const p2 = classicQueue.shift()!;
      const s1 = gameNs.sockets.get(p1.id)!;
      const s2 = gameNs.sockets.get(p2.id)!;

      // démarrage de la simulation de pong
      const match = startMatch(s1, s2, gameNs);
      matchStates.set(match.roomId, match);

      playerInfo.set(p1.id, { side: 0, mode: 'multi' });
      playerInfo.set(p2.id, { side: 1, mode: 'multi' });

      s1.join(match.roomId);
      s2.join(match.roomId);

      // envoi de l’événement matchFound avec pseudos
      s1.emit('matchFound', {
        roomId: match.roomId,
        side: 0,
        mode: 'multi',
        you: p1.username,
        opponent: p2.username
      });
      s2.emit('matchFound', {
        roomId: match.roomId,
        side: 1,
        mode: 'multi',
        you: p2.username,
        opponent: p1.username
      });
    }
  }

  // ============================================
  // FONCTION D’ASSOCIATION POUR 3 JOUEURS TRI-PONG
  function attemptTriMatch() {
    while (triQueue.length >= 3) {
      const trio = triQueue.splice(0, 3);
      const socks = trio
        .map(p => gameNs.sockets.get(p.id))
        .filter((s): s is Socket => !!s);

      // démarrage de la simulation tri-pong
      const match = startTriMatch(socks, gameNs);
      triMatchStates.set(match.roomId, match);

      // extrait les trois pseudos
      const players = trio.map(p => p.username);

      socks.forEach((s, i) => {
        playerInfo.set(s.id, { side: i, mode: 'tri' });
        s.join(match.roomId);
        s.emit('matchFoundTri', {
          roomId: match.roomId,
          side: i,
          players
        });
      });

      // boucle serveur pour tri-pong
      const tick = setInterval(() => {
        const m = triMatchStates.get(match.roomId)!;
        updateTriMatch(m);
        gameNs.to(match.roomId).emit('stateUpdateTri', m);
        if (m.gameOver) clearInterval(tick);
      }, 1000 / 60);
    }
  }
}
