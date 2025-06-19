import type { Socket, Namespace } from 'socket.io';

// State of a Bi-Pong circular match
export interface MatchState {
  roomId: string;
  paddles: { phi: number; lives: number; direction: 'up'|'down'|null }[];
  ball: { x:number; y:number; vx:number; vy:number; r:number };
  gameOver: boolean;
  userIds?: [number, number]; // Ajout pour gestion backend des stats
}


// Constants (to synchronize strictly on the client side)
const BALL_SPEED        = 4;
const RADIUS            = 340;              // same radius as the client
const ARC_HALF          = Math.PI / 18;     // 20° d’arc
const PADDLE_SPEED      = Math.PI / 180 * 2;
const MAX_DEFLECTION    = Math.PI / 6;
const SPEED_MULTIPLIER  = 1.05;

// Replace the ball at the center with the base speed
function resetBall(ball: MatchState['ball']) {
  ball.x = 0; ball.y = 0;
  const a = Math.random() * 2 * Math.PI;
  ball.vx = BALL_SPEED * Math.cos(a);
  ball.vy = BALL_SPEED * Math.sin(a);
}

export function startMatch(
  socks: Socket[],
  nsp: Namespace,
  isSolo: boolean,
  roomIdOverride?: string,
  userIds?: [number, number]
): MatchState {
  const roomId = roomIdOverride || `${Date.now()}`;
  socks.forEach(s => s.join(roomId));

  // Two paddles at 90° and 270°
  const paddles = [
    { phi:  Math.PI/2, lives: 3, direction: null },
    { phi: -Math.PI/2, lives: 3, direction: null }
  ];

  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 8 };
  const state: MatchState = { roomId, paddles, ball, gameOver: false };
  if (userIds) state.userIds = userIds;

  const delay = isSolo ? 1_000 : 6_000;
  
  setTimeout(() => {
    resetBall(state.ball);
  }, delay);
  return state;
}

export async function updateMatch(match: MatchState, nsp: Namespace): Promise<void> {
  const normalizeAngle360 = (angle: number) =>
    ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const signedAngleDiff = (a: number, b: number) => {
    let d = normalizeAngle360(a) - normalizeAngle360(b);
    if (d >  Math.PI)  d -= 2 * Math.PI;
    if (d <= -Math.PI) d += 2 * Math.PI;
    return d;
  };

  // --- 1) MOUVEMENT DES PADDLES + CLAMP ---
  const aliveIndices = match.paddles
    .map((p, i) => p.lives > 0 ? i : -1)
    .filter(i => i >= 0);

  aliveIndices.forEach(i => {
    const paddle = match.paddles[i];
    // movement
    if (paddle.direction === 'up')   paddle.phi -= PADDLE_SPEED;
    if (paddle.direction === 'down') paddle.phi += PADDLE_SPEED;
    paddle.phi = normalizeAngle360(paddle.phi);

    // clamp vis-à-vis des voisins vivants (alive neighbors)
    const sorted = aliveIndices.slice().sort((a, b) =>
      normalizeAngle360(match.paddles[a].phi) - normalizeAngle360(match.paddles[b].phi)
    );
    const idxPrev = (sorted.indexOf(i) - 1 + sorted.length) % sorted.length;
    const idxNext = (sorted.indexOf(i) + 1) % sorted.length;
    const phiPrev = normalizeAngle360(match.paddles[sorted[idxPrev]].phi);
    const phiNext = normalizeAngle360(match.paddles[sorted[idxNext]].phi);

    const lowBound  = normalizeAngle360(phiPrev + 2 * ARC_HALF);
    const highBound = normalizeAngle360(phiNext - 2 * ARC_HALF);

    const inRange = lowBound <= highBound
      ? (paddle.phi >= lowBound && paddle.phi <= highBound)
      : (paddle.phi >= lowBound || paddle.phi <= highBound);

    if (!inRange) {
      const dLow  = Math.abs(signedAngleDiff(paddle.phi, lowBound));
      const dHigh = Math.abs(signedAngleDiff(paddle.phi, highBound));
      paddle.phi = normalizeAngle360(dLow < dHigh ? lowBound : highBound);
    }
  });

  // --- 2) MOUVEMENT DE LA BALLE ---
  const b = match.ball;
  b.x += b.vx;
  b.y += b.vy;

  const dx = b.x, dy = b.y;
  const dist = Math.hypot(dx, dy);

  // --- 3) COLLISION AVEC LE BORD CIRCULAIRE ---
  if (dist + b.r >= RADIUS) {
    const nx = dx / dist, ny = dy / dist;
    const penetration = dist + b.r - RADIUS;
    b.x -= nx * penetration;
    b.y -= ny * penetration;

    const velDot = b.vx * nx + b.vy * ny;
    if (velDot > 0) {
      const hitAngle = Math.atan2(dy, dx);
      // search for the touched paddle
      const hit = match.paddles.find(paddle =>
        paddle.lives > 0
        && Math.abs(signedAngleDiff(hitAngle, paddle.phi)) <= ARC_HALF
      );

      if (hit) {
        // 3a) vector reflection: v' = v - 2 (v·n) n
        const vDotN = b.vx * nx + b.vy * ny;
        let rvx = b.vx - 2 * vDotN * nx;
        let rvy = b.vy - 2 * vDotN * ny;

        // 3b) small random deviation
        const deflect = (Math.random() * 2 - 1) * MAX_DEFLECTION;
        const newAngle = Math.atan2(rvy, rvx) + deflect;

        // 3c) slight speed gain
        const newSpeed = Math.hypot(rvx, rvy) * SPEED_MULTIPLIER;
        b.vx = newSpeed * Math.cos(newAngle);
        b.vy = newSpeed * Math.sin(newAngle);
      } else {
        // missed → loss of a life
        let loser = -1, bestDiff = Infinity;
        match.paddles.forEach((paddle, i) => {
          if (paddle.lives > 0) {
            const d = Math.abs(signedAngleDiff(hitAngle, paddle.phi));
            if (d < bestDiff) { bestDiff = d; loser = i; }
          }
        });
        if (loser >= 0) match.paddles[loser].lives--;

        // reset to the initial speed
        resetBall(b);
      }
    }
  }

  // --- 4) FIN DE PARTIE ---
  if (match.paddles.filter(p => p.lives > 0).length <= 1) {
    match.gameOver = true;
    // Emit the end of game event to refresh the ranking on the client side
    nsp.to(match.roomId).emit('pongGameEnded', { gameId: 1 }); // 1 = id of the Pong game
  }
}
