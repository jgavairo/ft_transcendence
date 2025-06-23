import { stopGame } from "./pongGame.js";
// pauseMenu.ts

export let showPauseMenu = false;
export let hoverResume = false;
export let hoverQuit   = false;

let escapeHandler: ((e: KeyboardEvent) => void) | null = null;
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let clickHandler: ((e: MouseEvent) => void) | null = null;

export function onEscapeKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    showPauseMenu = !showPauseMenu;
  }
}

export function removePauseMenuListeners(canvas?: HTMLCanvasElement) {
  if (escapeHandler) {
    window.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
  if (canvas && mouseMoveHandler) {
    canvas.removeEventListener('mousemove', mouseMoveHandler);
    mouseMoveHandler = null;
  }
  if (canvas && clickHandler) {
    canvas.removeEventListener('click', clickHandler);
    clickHandler = null;
  }
}

// Initialise le menu pause : installe le toggle Escape et le click listener
export function initPauseMenu(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  displayMenu: () => void
) {
  // 1) Toggle avec la touche Échap
  escapeHandler = (e: KeyboardEvent) => onEscapeKey(e);
  window.addEventListener('keydown', escapeHandler);

  mouseMoveHandler = (e: MouseEvent) => {
    if (!showPauseMenu) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // mêmes calculs que pour click…
    const CW = canvas.width;
    const CH = canvas.height;
    const CX = CW / 2;
    const CY = CH / 2;
    const pmWidth   = 300;
    const btnW      = 200;
    const btnH      = 60;
    const spacing   = 20;
    const paddingV  = 20;
    const totalBtnsH = btnH * 2 + spacing;
    const pmHeight   = totalBtnsH + paddingV * 2;
    const pmY        = CY - pmHeight / 2;
    const btnX       = CX - btnW / 2;
    // Y des deux boutons
    const btnResumeY = pmY + paddingV;
    const btnQuitY   = btnResumeY + btnH + spacing;
    // on teste le hover par simple AABB
    hoverResume = x >= btnX && x <= btnX + btnW
      && y >= btnResumeY && y <= btnResumeY + btnH;
    hoverQuit   = x >= btnX && x <= btnX + btnW
      && y >= btnQuitY   && y <= btnQuitY   + btnH;
  };
  canvas.addEventListener('mousemove', mouseMoveHandler);

  clickHandler = (e: MouseEvent) => {
    if (!showPauseMenu) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calcul des dimensions du menu
    const CW = canvas.width;
    const CH = canvas.height;
    const CX = CW / 2;
    const CY = CH / 2;
  
    const pmWidth   = 300;
    const btnW      = 200;
    const btnH      = 60;
    const spacing   = 20;
    const paddingV  = 20;
  
    const totalBtnsH = btnH * 2 + spacing;
    const pmHeight   = totalBtnsH + paddingV * 2;
    const pmY        = CY - pmHeight / 2;
    const btnX       = CX - btnW / 2;

    // Y des deux boutons
    const btnResumeY = pmY + paddingV;
    const btnQuitY   = btnResumeY + btnH + spacing;

    // Resume ?
    if (
      x >= btnX && x <= btnX + btnW
      && y >= btnResumeY && y <= btnResumeY + btnH
    ) {
      showPauseMenu = false;
    }
    // Quit ?
    else if (
      x >= btnX && x <= btnX + btnW
      && y >= btnQuitY   && y <= btnQuitY   + btnH
    ) {
        // Supprime les listeners pause avant de quitter
        removePauseMenuListeners(canvas);
        stopGame();
        showPauseMenu = false;
        displayMenu();
    }
  };
  canvas.addEventListener('click', clickHandler);
}

export function drawPauseMenu(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const CW = canvas.width;
  const CH = canvas.height;
  const CX = CW / 2;
  const CY = CH / 2;
  
  // dimensions et espacement des boutons
  const btnW     = 200;
  const btnH     = 60;
  const spacing  = 20; // espace entre les boutons
  const totalBtnsH = btnH*2 + spacing;
  
  // dimensions de la boîte pause
  const pmWidth  = 300;
  const pmHeight = 200;
  const pmX      = CX - pmWidth/2;
  const pmY      = CY - pmHeight/2;
  
  // on centre horizontalement :
  const btnX = pmX + (pmWidth - btnW) / 2;
  
  // on centre verticalement l’ensemble des deux boutons + espacement :
  const startY     = pmY + (pmHeight - totalBtnsH) / 2;
  const btnResumeY = startY;
  const btnQuitY   = startY + btnH + spacing;

  ctx.save();
  // overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CW, CH);


  // === bouton Resume ===
  {
    const path = new Path2D();
    path.roundRect(btnX, btnResumeY, btnW, btnH, 5);
    ctx.fillStyle = hoverResume ? '#6506a9' : '#002eb2';
    ctx.fill(path);
    ctx.lineWidth   = 2;
    ctx.strokeStyle = hoverResume ? '#fc4cfc' : '#00e7fe';
    ctx.stroke(path);

    ctx.fillStyle   = '#fff';
    ctx.font        = '16px "Press Start 2P"';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText('Resume', CX, btnResumeY + btnH / 2);
  }

  // === bouton Quit ===
  {
    const path = new Path2D();
    path.roundRect(btnX, btnQuitY,   btnW, btnH, 5);
    ctx.fillStyle = hoverQuit ? '#6506a9' : '#002eb2';
    ctx.fill(path);
    ctx.lineWidth   = 2;
    ctx.strokeStyle = hoverQuit ? '#fc4cfc' : '#00e7fe';
    ctx.stroke(path);

    ctx.fillStyle   = '#fff';
    ctx.fillText('Quit', CX, btnQuitY + btnH / 2);
  }

  ctx.restore();
}
