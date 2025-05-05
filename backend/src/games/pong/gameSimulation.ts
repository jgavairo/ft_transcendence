import type { Socket, Namespace } from 'socket.io';

// État d’un match Bi-Pong circulaire
export interface MatchState {
  roomId: string;
  paddles: Array<{
    phi: number;                 // angle du paddle
    lives: number;
    direction: 'up'|'down'|null;
  }>;
  ball: { x: number; y: number; vx: number; vy: number; r: number };
  gameOver: boolean;
}

// Constantes (→ à synchroniser rigoureusement côté client)
const BALL_SPEED     = 4;
const RADIUS         = 340;              // même rayon que le client
const ARC_HALF       = Math.PI / 18;     // 20° d’arc
const P_SPEED        = Math.PI/180 * 2;
const MAX_DEFLECTION = Math.PI / 6;

export function startMatch(socks: Socket[], nsp: Namespace): MatchState {
  const roomId = `circ_${Date.now()}`;
  socks.forEach(s => s.join(roomId));

  // Deux paddles à 90° et 270°
  const paddles = [
    { phi:  Math.PI/2, lives: 3, direction: null },
    { phi: -Math.PI/2, lives: 3, direction: null }
  ];

  const ball = { x:0, y:0, vx:0, vy:0, r:8 };
  resetBall(ball);

  return { roomId, paddles, ball, gameOver: false };
}

export function updateMatch(match: MatchState) {
  const normalize = (φ: number) => (φ % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
  const signedDiff = (a: number, b: number) => {
    let d = normalize(a) - normalize(b);
    if (d >  Math.PI)  d -= 2*Math.PI;
    if (d <= -Math.PI) d += 2*Math.PI;
    return d;
  };
  const ARC_WIDTH = 2 * ARC_HALF;
  const minSep   = ARC_WIDTH;  // espacement minimal = largeur d’un arc

  // indices des arcs vivants
  const alive = match.paddles
    .map((p,i) => p.lives>0 ? i : -1)
    .filter(i => i >= 0);

  alive.forEach(i => {
    const p = match.paddles[i];
    // 1a) déplacement
    if (p.direction === 'up')   p.phi -= P_SPEED;
    if (p.direction === 'down') p.phi += P_SPEED;
    p.phi = normalize(p.phi);

    // 1b) clamp autour des deux voisins dans l’ordre angulaire
    const sorted = alive
      .slice()
      .sort((a,b) => normalize(match.paddles[a].phi) - normalize(match.paddles[b].phi));
    const idx   = sorted.indexOf(i)!;
    const prevI = sorted[(idx - 1 + sorted.length) % sorted.length];
    const nextI = sorted[(idx + 1) % sorted.length];

    const prevΦ = normalize(match.paddles[prevI].phi);
    const nextΦ = normalize(match.paddles[nextI].phi);

    // bornes de l’intervalle autorisé pour p.phi
    const low  = normalize(prevΦ + minSep);
    const high = normalize(nextΦ - minSep);

    const inInterval = low <= high
      ? (p.phi >= low && p.phi <= high)
      : (p.phi >= low || p.phi <= high);

    if (!inInterval) {
      // ramène sur la borne la plus proche
      const dLow  = Math.abs(signedDiff(p.phi, low));
      const dHigh = Math.abs(signedDiff(p.phi, high));
      p.phi = normalize(dLow < dHigh ? low : high);
    }
  });

  // --- 2) BALLE : avance et collision seulement vers l’extérieur ---
  const b = match.ball;
  b.x += b.vx;
  b.y += b.vy;

  const dx = b.x, dy = b.y;
  const dist = Math.hypot(dx, dy);

  if (dist + b.r >= RADIUS) {
    // repositionne à la frontière
    const nx = dx / dist, ny = dy / dist;
    const pen = dist + b.r - RADIUS;
    b.x -= nx * pen;
    b.y -= ny * pen;

    // recalcule composante radiale
    const velDot = b.vx * nx + b.vy * ny;
    if (velDot > 0) {
      const phiHit = Math.atan2(dy, dx);
      // cherche arc touché
      const hit = match.paddles.find(p =>
        p.lives > 0 && angleDiff(phiHit, p.phi) <= ARC_HALF
      );

      if (hit) {
        // réflexion + un peu d’aléa
        let rvx = b.vx - 2 * velDot * nx;
        let rvy = b.vy - 2 * velDot * ny;
        let phiR = Math.atan2(rvy, rvx) + (Math.random() * 2 - 1) * MAX_DEFLECTION;
        const speed = Math.hypot(rvx, rvy) * 1.02;
        b.vx = speed * Math.cos(phiR);
        b.vy = speed * Math.sin(phiR);
      } else {
        // raté → perte d’une vie du plus proche
        let idx = -1, best = Infinity;
        match.paddles.forEach((p, i) => {
          if (p.lives > 0) {
            const d = angleDiff(phiHit, p.phi);
            if (d < best) { best = d; idx = i; }
          }
        });
        if (idx >= 0) match.paddles[idx].lives--;
        resetBall(b);
      }
    }
  }

  // 4) Fin de partie
  if (match.paddles.filter(p=>p.lives>0).length <= 1) {
    match.gameOver = true;
  }
}

function resetBall(b: Pick<MatchState,'ball'>['ball']) {
  b.x = 0; b.y = 0;
  const a = Math.random()*2*Math.PI;
  b.vx = BALL_SPEED*Math.cos(a);
  b.vy = BALL_SPEED*Math.sin(a);
}

function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}
