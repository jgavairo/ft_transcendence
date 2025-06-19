import { displayMenu, PongMenuManager } from './DisplayMenu.js';
import { ctx } from '../pongGame.js';

const CW = 1200;
const CH = 800;
const CX = CW / 2;
const CY = CH / 2;
let showOptions = false;
const btnWidth = 140;
const btnHeight = 50;
const btnY = CH - btnHeight - 20;
const btnMenuX = CX - btnWidth - 20;
const btnQuitX = CX + 20;

// En haut du fichier, après les imports
function easeOutElastic(t: number): number {
  const p = 0.3;
  return Math.pow(2, -10 * t) *
         Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function onCanvasClick(e: MouseEvent) {
  if (!showOptions) return;
  // ← on récupère le canvas ici
  const canvasEl = ctx.canvas as HTMLCanvasElement;
  const rect = canvasEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // MENU
  if (x >= btnMenuX && x <= btnMenuX + btnWidth &&
      y >= btnY     && y <= btnY     + btnHeight) {
    displayMenu();
  }
  // QUIT
  else if (x >= btnQuitX && x <= btnQuitX + btnWidth &&
           y >= btnY     && y <= btnY     + btnHeight) {
    if (typeof window.close === 'function') window.close();
  }
}


function drawOptions() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(btnMenuX, btnY, btnWidth, btnHeight);
  ctx.fillRect(btnQuitX, btnY, btnWidth, btnHeight);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MENU', btnMenuX + btnWidth/2, btnY + btnHeight/2);
  ctx.fillText('QUIT', btnQuitX + btnWidth/2, btnY + btnHeight/2);
  ctx.restore();
}

let goFrame = 0;
const totalFrames = 180;

function startAnimation(drawText: (frame: number) => void) {
  // Configuration
  const particles: Spark[] = [];
  const maxParticles = 100;
  let goFrame = 0;
  let showOptions = false;
  let listenerAttached = false;

  // Classe Spark (les particules)
  class Spark {
    x: number; y: number; vx: number; vy: number; life: number;
    constructor() {
      const angle = Math.random() * 2 * Math.PI;
      const speed = 2 + Math.random() * 4;
      this.x = CX; this.y = CY;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 30 + Math.random() * 30;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.1;  // gravité légère
      this.life--;
    }
    draw(ctx: CanvasRenderingContext2D) {
      ctx.globalAlpha = Math.max(0, this.life / 60);
      ctx.fillRect(this.x, this.y, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  // La boucle d’animation
  function frame() {
    // 1) On n’attache le listener de clic qu’une seule fois
    if (!listenerAttached) {
      const canvasEl = ctx.canvas as HTMLCanvasElement;
      canvasEl.addEventListener('click', onCanvasClick);
      listenerAttached = true;
    }

    // 2) Clear
    ctx.clearRect(0, 0, CW, CH);

    // 3) Background radial animé
    const tBG = Math.min(1, goFrame / 60);
    const alphaBG = easeInOutQuad(tBG) * 0.8;
    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(CW, CH));
    grad.addColorStop(0, `rgba(20,0,0,${alphaBG})`);
    grad.addColorStop(1, `rgba(0,0,0,${alphaBG + 0.2})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // 4) Burst de particules au frame 30
    if (goFrame === 30) {
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Spark());
      }
    }
    ctx.fillStyle = '#fffdaa';
    particles.forEach((p, i) => {
      p.update();
      p.draw(ctx);
      if (p.life <= 0) particles.splice(i, 1);
    });

    // 5) Texte “YOU LOSE” / “YOU WIN”
    drawText(goFrame);

    // 6) Fade-out final (frames 140→180)
    if (goFrame >= 140) {
      const tF = (goFrame - 140) / 40;
      ctx.fillStyle = `rgba(0,0,0,${easeInOutQuad(tF)})`;
      ctx.fillRect(0, 0, CW, CH);
    }

    // 7) Affichage des boutons MENU / QUIT
    if (goFrame > totalFrames) showOptions = true;
    if (showOptions) drawOptions();

    // 8) Incrément et boucle
    goFrame++;
    requestAnimationFrame(frame);
  }

  // Lancement
  goFrame = 0;
  showOptions = false;
  requestAnimationFrame(frame);
}


export function animateEnd(winnerName: string, padColor: string): void {
  // startAnimation((frame) => {
  //   if (frame >= 60) {
  //     const tText = Math.min(1, (frame - 60) / 40);
  //     const scale = easeOutElastic(tText);
  //     const shake = (1 - tText) * 10 * Math.sin(frame * 0.5);

  //     ctx.save();
  //     ctx.translate(CX + shake, CY);
  //     ctx.scale(scale, scale);

  //     ctx.font        = 'bold 96px Arial';
  //     ctx.textAlign   = 'center';
  //     ctx.lineWidth   = 2;
  //     ctx.shadowColor = padColor;
  //     ctx.shadowBlur  = 20;
  //     ctx.fillStyle   = padColor;

  //     ctx.fillText(`${winnerName} WIN`, 0, 0);
  //     ctx.restore();
  //   }
  // });
  const menu = new PongMenuManager(false);
  menu.displayEndMatch(winnerName, padColor);
}