import type { Socket, Namespace } from 'socket.io';

export interface TriMatchState {
  roomId: string;
  paddles: Array<{
    phi: number;                // position angulaire
    lives: number;                // vies restantes
    direction: 'up'|'down'|null;  // commande en cours
  }>;
  ball: { x: number; y: number; vx: number; vy: number; r: number };
  gameOver: boolean;
}

// constantes du terrain (doivent matcher le client)
const BALL_SPEED       = 4;

export function startTriMatch(sockets: Socket[], nsp: Namespace): TriMatchState {
  const roomId = `tri_${Date.now()}`;
  sockets.forEach(s => s.join(roomId));

  // trois paddles répartis uniformément
  const baseAngle = Math.PI / 2;
  const delta     = 2 * Math.PI / 3;
  const paddles = sockets.map((_, i) => ({
    phi: baseAngle + i * delta,
    lives: 3,
    direction: null as 'up'|'down'|null
  }));

  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 8 };
  const state: TriMatchState = { roomId, paddles, ball, gameOver: false };

  // service initial après 4 secondes
  setTimeout(() => resetBallPosition(state.ball), 6000);

  return state;
}

// remet la balle au centre avec vitesse de base
function resetBallPosition(ball: TriMatchState['ball']) {
  ball.x = 0; ball.y = 0;
  const a = Math.random() * 2 * Math.PI;
  ball.vx = BALL_SPEED * Math.cos(a);
  ball.vy = BALL_SPEED * Math.sin(a);
}
