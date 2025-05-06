import type { Socket, Namespace } from 'socket.io';

export interface TriMatchState {
  roomId: string;
  paddles: Array<{
    phi: number;                   // position angulaire
    lives: number;                 // vies restantes
    direction: 'up'|'down'|null;   // commande en cours
  }>;
  ball: { x:number, y:number, vx:number, vy:number, r:number };
  gameOver: boolean;
}

// constantes du terrain (à garder en sync avec le client)
// constantes du terrain (doivent matcher EXACTEMENT le client)
const BALL_SPEED    = 4;
const RADIUS        = 340;               // identique au R du client
const ARC_HALF      = Math.PI / 18;      // ← 10° de chaque côté
const P_SPEED       = Math.PI / 180 * 2;
const MAX_DEFLECTION= Math.PI / 6;


export function startTriMatch(socks: Socket[], nsp: Namespace): TriMatchState {
  const roomId = `tri_${Date.now()}`;
  socks.forEach(s=>s.join(roomId));
  const paddles = [
    { phi: Math.PI/2,    lives: 3, direction: null },
    { phi: -Math.PI/6,   lives: 3, direction: null },
    { phi: 7*Math.PI/6,  lives: 3, direction: null },
  ];
  const ball = { x:0, y:0, vx:0, vy:0, r:8 };
  const state: TriMatchState = { roomId, paddles, ball, gameOver: false };
  setTimeout(() => {
    resetTriBall(ball);
  }, 3600);
  return state;
}


export function updateTriMatch(match: TriMatchState) {
    // --- 1) PADDLES : mouvement + collision entre paddles ---
    const ARC_WIDTH = 2 * ARC_HALF;
    const minSep = ARC_WIDTH;
  
    // helper pour normaliser et diff angulaire
    const normalize = (φ: number) => { φ %= 2*Math.PI; return φ < 0 ? φ + 2*Math.PI : φ; };
    const signedDiff = (a: number, b: number) => {
      let d = normalize(a) - normalize(b);
      if (d >  Math.PI) d -= 2*Math.PI;
      if (d <= -Math.PI) d += 2*Math.PI;
      return d;
    };
  
    // indices des paddles vivants
    const alive = match.paddles
      .map((p,i) => p.lives>0 ? i : -1)
      .filter(i => i>=0);
  
    // pour chaque paddle vivant, on applique direction + clamp vis-à-vis de ses voisins vivants
    alive.forEach(i => {
      const p = match.paddles[i];
      // 1a) move
      if (p.direction === 'up')   p.phi -= P_SPEED;
      if (p.direction === 'down') p.phi += P_SPEED;
      p.phi = normalize(p.phi);
  
      // 1b) collision avec ses deux voisins vivants
      // on retrouve prev/next dans l’ordre angulaire
      const sorted = alive
        .slice()
        .sort((a,b) => normalize(match.paddles[a].phi) - normalize(match.paddles[b].phi));
      const idx  = sorted.indexOf(i)!;
      const prevI = sorted[(idx - 1 + sorted.length) % sorted.length];
      const nextI = sorted[(idx + 1) % sorted.length];
  
      const prevΦ = normalize(match.paddles[prevI].phi);
      const nextΦ = normalize(match.paddles[nextI].phi);
  
      const low  = normalize(prevΦ + minSep);
      const high = normalize(nextΦ - minSep);
  
      // test intervalle [low,high] avec wrap
      const inInterval = low <= high
        ? (p.phi >= low && p.phi <= high)
        : (p.phi >= low || p.phi <= high);
  
      if (!inInterval) {
        // clamp à la borne la plus proche
        const dLow  = Math.abs(signedDiff(p.phi, low));
        const dHigh = Math.abs(signedDiff(p.phi, high));
        p.phi = normalize(dLow < dHigh ? low : high);
      }
    });
  
    // --- 2) BALLE : avance et collision uniquement si balle sort vers l’extérieur ---
    const b = match.ball;
  b.x += b.vx;
  b.y += b.vy;

  const dx = b.x, dy = b.y;
  const dist = Math.hypot(dx, dy);

  if (dist + b.r >= RADIUS) {
    // 2a) On repositionne la balle juste à la frontière
    const nx = dx / dist, ny = dy / dist;
    const penetration = dist + b.r - RADIUS;
    b.x -= nx * penetration;
    b.y -= ny * penetration;

    // 2b) On recalcule la composante radiale
    const velDot = b.vx * nx + b.vy * ny;
    if (velDot > 0) {
      const phiHit = Math.atan2(dy, dx);

      // On cherche un paddle vivant qui couvre l’impact
      const hit = match.paddles.find(p =>
        p.lives > 0 && angleDiff(phiHit, p.phi) <= ARC_HALF
      );

      if (hit) {
        // Réflexion classique
        let rvx = b.vx - 2 * velDot * nx;
        let rvy = b.vy - 2 * velDot * ny;

        // Déflection aléatoire
        let phiR = Math.atan2(rvy, rvx) + (Math.random() * 2 - 1) * MAX_DEFLECTION;
        const speed = Math.hypot(rvx, rvy) * 1.02;

        b.vx = speed * Math.cos(phiR);
        b.vy = speed * Math.sin(phiR);
      } else {
        // Raté → le plus proche perd une vie
        let idx = -1, best = Infinity;
        match.paddles.forEach((p, i) => {
          if (p.lives > 0) {
            const d = angleDiff(phiHit, p.phi);
            if (d < best) { best = d; idx = i; }
          }
        });
        if (idx >= 0) match.paddles[idx].lives--;

        resetTriBall(b);
      }
    }
  }
  
    // --- 3) FIN DE PARTIE ---
    if (match.paddles.filter(p=>p.lives>0).length <= 1) {
      match.gameOver = true;
    }
  }
  
  function resetTriBall(b: TriMatchState['ball']) {
    b.x = 0; b.y = 0;
    const a = Math.random()*2*Math.PI;
    b.vx = BALL_SPEED*Math.cos(a);
    b.vy = BALL_SPEED*Math.sin(a);
  }

  function angleDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % (2 * Math.PI);
    return d > Math.PI ? 2 * Math.PI - d : d;
  }