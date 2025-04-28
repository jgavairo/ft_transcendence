import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:3000/game', {
  withCredentials: true,
});

socket.on('connect', () => {
});

let mode: 'solo' | 'multi' = 'multi';
let mySide: 'left' | 'right' = 'left';

socket.on('matchFound', ({ roomId, side }: { roomId: string, side: 'left' | 'right' }) => {
  mySide = side;
  if (mode === 'multi') {
    displayWaitingScreen();
  }
});

socket.on('gameState', (state: any) => {
  renderGame(state);
});

let selectedPaddleColor: string = 'white';

const paddleSkinImages: { [key: string]: HTMLImageElement } = {
  Skin1: new Image(),
  Skin2: new Image(),
  Skin3: new Image()
};

paddleSkinImages.Skin1.src = '/scripts/games/pong/assets/skin1.png';
paddleSkinImages.Skin2.src = '/scripts/games/pong/assets/skin2.png';
paddleSkinImages.Skin3.src = '/scripts/games/pong/assets/skin3.png';

const bgImage = new Image();
bgImage.src = '/scripts/games/pong/assets/background.png';

const menuBg = new Image();
menuBg.src = '/scripts/games/pong/assets/menuBg.png';

const shopBg = new Image();
shopBg.src = '/scripts/games/pong/assets/shopBg.png';


let loadingAngle = 0;
let loadingReqId: number | null = null;

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, filled: boolean): void {
  ctx.save();
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(
    x, y,
    x - size / 2, y,
    x - size / 2, y + topCurveHeight
  );
  ctx.bezierCurveTo(
    x - size / 2, y + (size + topCurveHeight) / 2,
    x, y + (size + topCurveHeight) / 2,
    x, y + size
  );
  ctx.bezierCurveTo(
    x, y + (size + topCurveHeight) / 2,
    x + size / 2, y + (size + topCurveHeight) / 2,
    x + size / 2, y + topCurveHeight
  );
  ctx.bezierCurveTo(
    x + size / 2, y,
    x, y,
    x, y + topCurveHeight
  );
  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'white';
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = 'red';
    ctx.fill();
  }
  ctx.restore();
}

function drawLives(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, leftLives: number, rightLives: number): void {
  const heartSize = 20;
  const gap = 10;
  const totalLives = 5;
  if (loadingReqId !== null) cancelAnimationFrame(loadingReqId);
  const leftStartX = 20;
  const leftY = 20;
  for (let i = 0; i < totalLives; i++) {
    const filled = i < leftLives;
    drawHeart(ctx, leftStartX + i * (heartSize + gap) + heartSize / 2, leftY, heartSize, filled);
  }

  const rightStartX = canvas.width - 20 - totalLives * (heartSize + gap) + gap;
  const rightY = 20;
  for (let i = 0; i < totalLives; i++) {
    const filled = i < rightLives;
    drawHeart(ctx, rightStartX + i * (heartSize + gap) + heartSize / 2, rightY, heartSize, filled);
  }
}


function renderGame(matchState: any): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  canvas.width = cw;
  canvas.height = ch;

  ctx.clearRect(0, 0, cw, ch);

  if (bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, cw, ch);
  } else {
    bgImage.onload = () => {
      ctx.drawImage(bgImage, 0, 0, cw, ch);
    };
  }

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(matchState.ballX, matchState.ballY, 10, 0, Math.PI * 2);
  ctx.fill();

  const paddleWidth = 10;
  const paddleHeight = 100;
  if (selectedPaddleColor.startsWith("Skin") && paddleSkinImages[selectedPaddleColor]) {
    ctx.drawImage(paddleSkinImages[selectedPaddleColor], 30, matchState.leftPaddleY, paddleWidth, paddleHeight);
    ctx.drawImage(paddleSkinImages[selectedPaddleColor], canvas.width - 30 - paddleWidth, matchState.rightPaddleY, paddleWidth, paddleHeight);
  } else {
    ctx.fillStyle = selectedPaddleColor;
    ctx.fillRect(30, matchState.leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 30 - paddleWidth, matchState.rightPaddleY, paddleWidth, paddleHeight);
  }

  drawLives(ctx, canvas, matchState.leftLives, matchState.rightLives);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "w" || event.key === "W") {
    socket.emit("movePaddle", { paddle: mySide, direction: "up" });
  }
  if (event.key === "s" || event.key === "S") {
    socket.emit("movePaddle", { paddle: mySide, direction: "down" });
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "w" || event.key === "W" || event.key === "s" || event.key === "S") {
    socket.emit("movePaddle", { paddle: mySide, direction: null });
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    socket.emit("movePaddle", { paddle: "right", direction: "up" });
  }
  if (event.key === "ArrowDown") {
    socket.emit("movePaddle", { paddle: "right", direction: "down" });
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowUp"|| event.key === "ArrowDown") {
    socket.emit("movePaddle", { paddle: "right", direction: null });
  }
});



function displayWaitingScreen(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Waiting for opponent...', canvas.width / 2, canvas.height / 2 - 40);

  animateSpinner();
}

function animateSpinner(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 20;
  const radius = 20;

  ctx.clearRect(cx - radius - 5, cy - radius - 5, radius * 2 + 10, radius * 2 + 10);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(loadingAngle);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 1.2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'white';
  ctx.stroke();
  ctx.restore();

  loadingAngle += 0.1;
  loadingReqId = requestAnimationFrame(animateSpinner);
}

export function displayMenu(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  canvas.width = cw;
  canvas.height = ch;

  if (menuBg.complete) {
    ctx.drawImage(menuBg, 0, 0, cw, ch);
  } else {
    menuBg.onload = () => {
      ctx.drawImage(menuBg, 0, 0, cw, ch);
    };
  }

  const buttonWidth = 300;
  const buttonHeight = 100;
  const playY = ch / 2 - 60;
  const shopY = ch / 2 + 90;
  const centerX = (cw - buttonWidth) / 2 - 10;

  const handler = (e: MouseEvent) => {
    const { left, top } = canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    if (x >= centerX && x <= centerX+buttonWidth) {
      if (y >= playY && y <= playY+buttonHeight) {
        canvas.removeEventListener('click', handler);
        displayPlayMenu();
      } else if (y >= shopY && y <= shopY+buttonHeight) {
        canvas.removeEventListener('click', handler);
        displayShopMenu();
      }
    }
  };
  canvas.addEventListener('click', handler);
}

export function displaySoloMenu(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const cw = canvas.clientWidth,
        ch = canvas.clientHeight;
  canvas.width = cw;
  canvas.height = ch;

  // Fond & titre
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = 'white';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Local Mode', cw/2, ch*0.2);

  interface Button { label: string; x: number; y: number; w: number; h: number; onClick: () => void; }
  const btnW = 250, btnH = 60, spacing = 30;
  const startY = ch*0.35, x0 = cw/2 - btnW/2;

  const buttons: Button[] = [
    {
      label: '1 Player', x: x0, y: startY,
      w: btnW, h: btnH,
      onClick: () => {
        // TODO: implémenter 1 player
        console.log('1 Player');
      }
    },
    {
      label: '2 Players', x: x0, y: startY + (btnH + spacing),
      w: btnW, h: btnH,
      onClick: () => {
        // Lance la partie pour 2 joueurs (reprise du solo)
        teardownSolo();
        socket.emit('startSolo', { username: 'Player1' });
      }
    },
    {
      label: '4 Players', x: x0, y: startY + 2*(btnH + spacing),
      w: btnW, h: btnH,
      onClick: () => {
        console.log('4 Players');
      }
    },
    {
      label: 'Back',
      x: x0, y: startY + 3*(btnH+spacing),
      w: btnW, h: btnH,
      onClick: () => {
        displayPlayMenu();
      }
    }
  ];

  // Dessin des boutons
  buttons.forEach(btn => {
    ctx.fillStyle = '#222';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w/2, btn.y + btn.h/2);
  });

  // Handler global
  const handler = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const btn of buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        btn.onClick();
        break;
      }
    }
  };
  canvas.addEventListener('click', handler);

  function teardownSolo() {
    canvas.removeEventListener('click', handler);
  }
}

export function displayPlayMenu(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  canvas.width = cw;
  canvas.height = ch;

  // — Fond & titre —
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = 'white';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Choose a gamemode', cw / 2, ch * 0.2);

  // — Définition des boutons —
  interface Button { label: string; x: number; y: number; w: number; h: number; onClick: () => void; }
  const btnW = 300, btnH = 70, spacing = 30;
  const startY = ch * 0.35;
  const x0 = cw/2 - btnW/2;

  const buttons: Button[] = [
    {
      label: 'Solo',
      x: x0, y: startY,
      w: btnW, h: btnH,
      onClick: () => {
        mode = 'solo';
        teardown();
        displaySoloMenu();
      }
    },
    {
      label: 'Multijoueur',
      x: x0, y: startY + (btnH+spacing),
      w: btnW, h: btnH,
      onClick: () => {
        mode = 'multi';
        teardown();
        socket.emit('joinQueue', { playerId: socket.id, username: 'Player1' });
        displayWaitingScreen();
      }
    },
    {
      label: 'Tournoi',
      x: x0, y: startY + 2*(btnH+spacing),
      w: btnW, h: btnH,
      onClick: () => {
        teardown();
        // Implémente ta logique tournoi ici, p.ex. :
        // gameSocket.emit('startTournament', { username: 'Player1' });
        displayWaitingScreen();
      }
    },
    {
      label: 'Back',
      x: x0, y: startY + 3*(btnH+spacing),
      w: btnW, h: btnH,
      onClick: () => {
        teardown();
        displayMenu();
      }
    }
  ];

  // — Dessin des boutons —
  buttons.forEach(btn => {
    ctx.fillStyle = '#222';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w/2, btn.y + btn.h/2);
  });

  // — Handler global pour détecter les clics sur un bouton —
  const handler = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const btn of buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        btn.onClick();
        break;
      }
    }
  };

  canvas.addEventListener('click', handler);

  // Permet de nettoyer le listener lorsqu'on quitte ce menu
  function teardown() {
    canvas.removeEventListener('click', handler);
  }
}


export function displayShopMenu(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  
  interface SkinOption {
    name: string;
    image: string;
  }
  
  const options: SkinOption[] = [
    { name: 'Skin1', image: '/scripts/games/pong/assets/skin1.png' },
    { name: 'Skin2', image: '/scripts/games/pong/assets/skin2.png' },
    { name: 'Skin3', image: '/scripts/games/pong/assets/skin3.png' }
  ];
  
  const buttonSize = 150;
  const spacing = 90;
  const totalWidth = options.length * buttonSize + (options.length - 1) * spacing;
  const startX = (canvas.width - totalWidth) / 2 - 20;
  const buttonY = canvas.height / 2 - buttonSize / 2 - 40;
  
  if (shopBg.complete) {
    ctx.drawImage(shopBg, 0, 0, canvas.width, canvas.height);
  } else {
    shopBg.onload = () => {
      ctx.drawImage(shopBg, 0, 0, canvas.width, canvas.height);
    };
  }

  options.forEach((option, index) => {
    const x = startX + index * (buttonSize + spacing);
    const img = new Image();
    img.src = option.image;
    img.onload = () => {
      ctx.drawImage(img, x, buttonY, buttonSize, buttonSize);
    };
  });
  
  const backWidth = 120;
  const backHeight = 40;
  const backX = 175;
  const backY = canvas.height - backHeight - 100;

  const onClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    options.forEach((option, index) => {
      const x = startX + index * (buttonSize + spacing);
      if (
        mouseX >= x &&
        mouseX <= x + buttonSize &&
        mouseY >= buttonY &&
        mouseY <= buttonY + buttonSize
      ) {

        selectedPaddleColor = option.name;
        canvas.removeEventListener('click', onClick);
        displayMenu();
      }
    });

    if (
      mouseX >= backX &&
      mouseX <= backX + backWidth &&
      mouseY >= backY &&
      mouseY <= backY + backHeight
    ) {
      canvas.removeEventListener('click', onClick);
      displayMenu();
    }
  };
  
  canvas.addEventListener('click', onClick);
}

document.addEventListener('DOMContentLoaded', () => {
  displayMenu();
});
