import { gameover, ctx } from "./pongGame.js";

const CW = 1200;
const CH = 800;
const CX = CW / 2;
const CY = CH / 2;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}
export let explosion: Particle[] = [];

export function createExplosion(cx: number, cy: number) {
    explosion = [];
    const PARTICLE_COUNT = 40;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ang   = Math.random() * 2 * Math.PI;
      const speed = 4 + Math.random() * 3;
      // taille aléatoire entre 2 et 6px
      const size  = 2 + Math.random() * 4;
      // couleur aléatoire dans une gamme “feu” (nuances orange/jaune)
      const hue   = 30 + Math.random() * 40;     // 30°→70° = jaune→orange
      const light = 50 + Math.random() * 30;     // 50%→80% de luminosité
      const color = `hsl(${hue}, 100%, ${light}%)`;
  
      explosion.push({
        x: CX + cx,
        y: CY + cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        alpha: 1,
        size,
        color
      });
    }
    requestAnimationFrame(animateExplosion);
  }
  
  function animateExplosion() {
    // 1) mise à jour
    explosion.forEach(p => {
      p.x     += p.vx * 0.6;
      p.y     += p.vy * 0.6;
      p.alpha -= 0.02;
    });
    explosion = explosion.filter(p => p.alpha > 0);
  
    // 2) rendu
    explosion.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  
    // 3) suite de l’animation
    if (explosion.length && !gameover)
      requestAnimationFrame(animateExplosion);
  
  }
  
