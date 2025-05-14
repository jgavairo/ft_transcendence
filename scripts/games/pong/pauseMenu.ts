import { stopGame } from "./pongGame.js";
// pauseMenu.ts

export let showPauseMenu = false;

export function onEscapeKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    console.log('menu pause');
    showPauseMenu = !showPauseMenu;
  }
}

// Initialise le menu pause : installe le toggle Escape et le click listener
export function initPauseMenu(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  displayMenu: () => void
) {
  // 1) Toggle avec la touche Échap
  window.addEventListener('keydown', onEscapeKey);

  // 2) Click sur le canvas pour Resume/Quit
  canvas.addEventListener('click', (e: MouseEvent) => {
    if (!showPauseMenu) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calcul des dimensions du menu
    const CW = canvas.width;
    const CH = canvas.height;
    const CX = CW / 2;
    const CY = CH / 2;
    const pmWidth  = 300;
    const pmHeight = 180;
    const pmX = CX - pmWidth / 2;
    const pmY = CY - pmHeight / 2;
    const btnW = pmWidth - 40;
    const btnH = 40;
    const btnResumeY = pmY + 20;
    const btnQuitY   = btnResumeY + btnH + 20;

    // Resume ?
    if (
      x >= pmX + 20 && x <= pmX + 20 + btnW &&
      y >= btnResumeY && y <= btnResumeY + btnH
    ) {
      showPauseMenu = false;
    }
    // Quit ?
    else if (
      x >= pmX + 20 && x <= pmX + 20 + btnW &&
      y >= btnQuitY && y <= btnQuitY + btnH
    ) {
        stopGame();
        showPauseMenu = false;
        displayMenu();
    }
  });
}

// Dessine le menu pause en overlay
export function drawPauseMenu(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  const CW = canvas.width;
  const CH = canvas.height;
  const CX = CW / 2;
  const CY = CH / 2;

  const pmWidth  = 300;
  const pmHeight = 180;
  const pmX = CX - pmWidth / 2;
  const pmY = CY - pmHeight / 2;
  const btnW = pmWidth - 40;
  const btnH = 40;
  const btnResumeY = pmY + 20;
  const btnQuitY   = btnResumeY + btnH + 20;

  ctx.save();
  // a) Overlay semi-transparent
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CW, CH);

  // b) Boîte du menu
  ctx.fillStyle = '#333';
  ctx.fillRect(pmX, pmY, pmWidth, pmHeight);

  // c) Bouton Resume
  ctx.fillStyle = '#555';
  ctx.fillRect(pmX + 20, btnResumeY, btnW, btnH);
  ctx.fillStyle     = '#fff';
  ctx.font           = '24px Arial';
  ctx.textAlign      = 'center';
  ctx.textBaseline   = 'middle';
  ctx.fillText('Resume', CX, btnResumeY + btnH / 2);

  // d) Bouton Quit
  ctx.fillStyle = '#555';
  ctx.fillRect(pmX + 20, btnQuitY, btnW, btnH);
  ctx.fillStyle   = '#fff';
  ctx.fillText('Quit', CX, btnQuitY + btnH / 2);

  ctx.restore();
}
