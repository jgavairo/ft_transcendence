import type { Socket, Namespace } from 'socket.io';

export interface TriMatchState {
  roomId: string;
  paddles: Array<{
    angle: number;                // position angulaire
    lives: number;                // vies restantes
    direction: 'up'|'down'|null;  // commande en cours
  }>;
  ball: { x: number; y: number; vx: number; vy: number; r: number };
  gameOver: boolean;
}

// constantes du terrain (doivent matcher le client)
const BALL_SPEED       = 4;
const RADIUS           = 340;               // même rayon que le client
const HALF_ARC         = Math.PI / 18;      // 10° de chaque côté
const PADDLE_SPEED     = Math.PI / 180 * 2; // vitesse de rotation
const MAX_DEFLECTION   = Math.PI / 6;
const SPEED_MULTIPLIER = 1.05;

export function startTriMatch(sockets: Socket[], nsp: Namespace): TriMatchState {
  const roomId = `tri_${Date.now()}`;
  sockets.forEach(s => s.join(roomId));

  // trois paddles répartis uniformément
  const baseAngle = Math.PI / 2;
  const delta     = 2 * Math.PI / 3;
  const paddles = sockets.map((_, i) => ({
    angle: baseAngle + i * delta,
    lives: 3,
    direction: null as 'up'|'down'|null
  }));

  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 8 };
  const state: TriMatchState = { roomId, paddles, ball, gameOver: false };

  // service initial après 4 secondes
  setTimeout(() => resetBallPosition(state.ball), 4000);

  return state;
}

export function updateTriMatch(match: TriMatchState, nsp: Namespace): void {
  const normalize360 = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const signedDiff   = (a: number, b: number) => {
    let d = normalize360(a) - normalize360(b);
    if (d >  Math.PI) d -= 2 * Math.PI;
    if (d <= -Math.PI) d += 2 * Math.PI;
    return d;
  };

  // 1) bouger chaque paddle et empêcher les chevauchements
  const alive = match.paddles
    .map((p, i) => p.lives > 0 ? i : -1)
    .filter(i => i >= 0);

  alive.forEach(i => {
    const p = match.paddles[i];
    if (p.direction === 'up')    p.angle -= PADDLE_SPEED;
    if (p.direction === 'down')  p.angle += PADDLE_SPEED;
    p.angle = normalize360(p.angle);

    // clamp vis-à-vis de ses voisins vivants
    const sorted = alive.slice().sort((a, b) =>
      normalize360(match.paddles[a].angle) - normalize360(match.paddles[b].angle)
    );
    const idxPrev = (sorted.indexOf(i) - 1 + sorted.length) % sorted.length;
    const idxNext = (sorted.indexOf(i) + 1) % sorted.length;
    const anglePrev = normalize360(match.paddles[sorted[idxPrev]].angle);
    const angleNext = normalize360(match.paddles[sorted[idxNext]].angle);

    const minSeparation = 2 * HALF_ARC;
    const lowBound  = normalize360(anglePrev + minSeparation);
    const highBound = normalize360(angleNext - minSeparation);

    const inRange = lowBound <= highBound
      ? (p.angle >= lowBound && p.angle <= highBound)
      : (p.angle >= lowBound || p.angle <= highBound);

    if (!inRange) {
      const dLow  = Math.abs(signedDiff(p.angle, lowBound));
      const dHigh = Math.abs(signedDiff(p.angle, highBound));
      p.angle = normalize360(dLow < dHigh ? lowBound : highBound);
    }
  });

  // 2) avancer la balle
  const b = match.ball;
  b.x += b.vx;
  b.y += b.vy;

  const dx = b.x, dy = b.y;
  const dist = Math.hypot(dx, dy);

  // 3) collision cercle extérieur
  if (dist + b.r >= RADIUS) {
    const nx = dx / dist, ny = dy / dist;
    const overlap = dist + b.r - RADIUS;
    b.x -= nx * overlap;
    b.y -= ny * overlap;

    const velDot = b.vx * nx + b.vy * ny;
    if (velDot > 0) {
      const hitAngle = Math.atan2(dy, dx);
      const hit = match.paddles.find(p =>
        p.lives > 0 && Math.abs(signedDiff(hitAngle, p.angle)) <= HALF_ARC
      );

      if (hit) {
        // réflexion parfaite + petite déflection
        const vDotN = b.vx * nx + b.vy * ny;
        let rvx = b.vx - 2 * vDotN * nx;
        let rvy = b.vy - 2 * vDotN * ny;

        const randomDeflect = (Math.random() * 2 - 1) * MAX_DEFLECTION;
        const newAngle = Math.atan2(rvy, rvx) + randomDeflect;

        // légère augmentation de vitesse
        const newSpeed = Math.hypot(rvx, rvy) * SPEED_MULTIPLIER;
        b.vx = newSpeed * Math.cos(newAngle);
        b.vy = newSpeed * Math.sin(newAngle);
      } else {
        // raté → perd une vie + explosion
        let loser = -1, bestDiff = Infinity;
        match.paddles.forEach((p, i) => {
          if (p.lives > 0) {
            const d = Math.abs(signedDiff(hitAngle, p.angle));
            if (d < bestDiff) { bestDiff = d; loser = i; }
          }
        });
        if (loser >= 0) match.paddles[loser].lives--;
        nsp.to(match.roomId).emit('ballExplode', { x: b.x, y: b.y });
        resetBallPosition(b);
      }
    }
  }

  // 4) fin de partie
  if (match.paddles.filter(p => p.lives > 0).length <= 1) {
    match.gameOver = true;
  }
}

// remet la balle au centre avec vitesse de base
function resetBallPosition(ball: TriMatchState['ball']) {
  ball.x = 0; ball.y = 0;
  const a = Math.random() * 2 * Math.PI;
  ball.vx = BALL_SPEED * Math.cos(a);
  ball.vy = BALL_SPEED * Math.sin(a);
}
