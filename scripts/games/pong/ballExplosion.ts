import { gameover, ctx } from "./pongGame.js";


const CW = 1200;
const CH = 800;
const CX = CW / 2;
const CY = CH / 2;
const R  = Math.min(CW, CH) / 2 - 45; 


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
  
let goFrame = 0;
export function animateGameOver(): void {
  const totalFrames: number = 180;
  const particles: Spark[] = [];
  const maxParticles: number = 100;

  // Easing functions
  function easeOutElastic(t: number): number {
    const p: number = 0.3;
    return Math.pow(2, -10 * t) *
           Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }

  function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Particle class
  class Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;

    constructor() {
      const angle: number = Math.random() * 2 * Math.PI;
      const speed: number = 2 + Math.random() * 4;
      this.x = CX;
      this.y = CY;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 30 + Math.random() * 30;
    }

    update(): void {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1; // légère gravité
      this.life--;
    }

    draw(context: CanvasRenderingContext2D): void {
      context.globalAlpha = Math.max(0, this.life / 60);
      context.fillRect(this.x, this.y, 2, 2);
      context.globalAlpha = 1;
    }
  }

  function frame(): void {
    // 1) Clear canvas
    ctx.clearRect(0, 0, CW, CH);

    // 2) Fond radial animé
    const tBG: number = Math.min(1, goFrame / 60);
    const alphaBG: number = easeInOutQuad(tBG) * 0.8;
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(CW, CH));
    grad.addColorStop(0, `rgba(20, 0, 0, ${alphaBG})`);
    grad.addColorStop(1, `rgba(0, 0, 0, ${alphaBG + 0.2})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // 3) Burst de particules au frame 30
    if (goFrame === 30) {
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Spark());
      }
    }

    // update + draw particules
    ctx.fillStyle = '#fffdaa';
    particles.forEach((p, idx) => {
      p.update();
      p.draw(ctx);
      if (p.life <= 0) particles.splice(idx, 1);
    });

    // 4) Pop Texte « GAME OVER » (frames 60→100)
    if (goFrame >= 60) {
      const tText: number = Math.min(1, (goFrame - 60) / 40);
      const scale: number = easeOutElastic(tText);
      const shake: number = (1 - tText) * 10 * Math.sin(goFrame * 0.5);

      ctx.save();
      ctx.translate(CX + shake, CY);
      ctx.scale(scale, scale);
      ctx.font = 'bold 96px Arial';
      ctx.textAlign = 'center';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,20,20,0.6)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff4d4d';
      ctx.fillText('PAS PELUS', 0, 0);
      ctx.restore();
    }

    // 6) Fade out final (frames 140→180)
    if (goFrame >= 140) {
      const tF: number = (goFrame - 140) / 40;
      ctx.fillStyle = `rgba(0,0,0,${easeInOutQuad(tF)})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    goFrame++;
    if (goFrame <= totalFrames) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}
