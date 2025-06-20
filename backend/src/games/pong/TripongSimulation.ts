import type { Socket, Namespace } from 'socket.io';

export interface TriMatchState {
  roomId: string;
  paddles: Array<{
    phi: number;                // angular position
    lives: number;              // remaining lives
    direction: 'up'|'down'|null;  // current command
  }>;
  ball: { x: number; y: number; vx: number; vy: number; r: number };
  gameOver: boolean;
}

// Field constants (must match the client)
const BALL_SPEED = 4;

export function startTriMatch(sockets: Socket[], nsp: Namespace, isSolo: boolean): TriMatchState {
  const roomId = `tri_${Date.now()}`;
  sockets.forEach(s => s.join(roomId));

  // Three paddles evenly distributed
  const baseAngle = Math.PI / 2;
  const delta     = 2 * Math.PI / 3;
  const paddles = sockets.map((_, i) => ({
    phi: baseAngle + i * delta,
    lives: 3,
    direction: null as 'up'|'down'|null
  }));

  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 8 };
  const state: TriMatchState = { roomId, paddles, ball, gameOver: false };

  // Initial serve after 4 seconds
  const delay = isSolo ? 1_000 : 6_000;

  setTimeout(() => {
    resetBallPosition(state.ball);
  }, delay);

  return state;
}

// Reset the ball to the center with base speed
function resetBallPosition(ball: TriMatchState['ball']) {
  ball.x = 0; ball.y = 0;
  const a = Math.random() * 2 * Math.PI;
  ball.vx = BALL_SPEED * Math.cos(a);
  ball.vy = BALL_SPEED * Math.sin(a);
}
