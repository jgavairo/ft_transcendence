import io from 'socket.io-client';

console.log("Début de l'exécution du fichier pongGame.ts");
const socket = io('http://127.0.0.1:3000');

socket.on("matchFound", (data: any) => {
  console.log("Match found!", data);

});

socket.on("gameState", (matchState: any) => {
  renderGame(matchState);
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
  const heartSize = 20; // Taille du cœur
  const gap = 10;       // Espace entre les cœurs
  const totalLives = 5; // Nombre total de vies initiales
  if (loadingReqId !== null) cancelAnimationFrame(loadingReqId);
  // Cœurs pour le joueur gauche (positionnés en haut à gauche)
  const leftStartX = 20;
  const leftY = 20;
  for (let i = 0; i < totalLives; i++) {
    const filled = i < leftLives;
    // Ajuste la position horizontale pour espacer les cœurs
    drawHeart(ctx, leftStartX + i * (heartSize + gap) + heartSize / 2, leftY, heartSize, filled);
  }
  
  // Cœurs pour le joueur droit (positionnés en haut à droite)
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
    socket.emit("movePaddle", { paddle: "left", direction: "up" });
  }
  if (event.key === "s" || event.key === "S") {
    socket.emit("movePaddle", { paddle: "left", direction: "down" });
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "w" || event.key === "W" || event.key === "s" || event.key === "S") {
    socket.emit("movePaddle", { paddle: "left", direction: null });
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
  ctx.fillStyle = 'black';
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
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const buttonWidth = 150;
  const buttonHeight = 50;
  const playButtonY = canvas.height / 2 - 100;
  const shopButtonY = canvas.height / 2;
  const centerX = (canvas.width - buttonWidth) / 2;
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX, playButtonY, buttonWidth, buttonHeight);
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Play', centerX + buttonWidth / 2, playButtonY + buttonHeight / 2);
  
  ctx.strokeRect(centerX, shopButtonY, buttonWidth, buttonHeight);
  ctx.fillText('Shop', centerX + buttonWidth / 2, shopButtonY + buttonHeight / 2);
  
  const onClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    if (
      mouseX >= centerX &&
      mouseX <= centerX + buttonWidth &&
      mouseY >= playButtonY &&
      mouseY <= playButtonY + buttonHeight
    ) {
      canvas.removeEventListener('click', onClick);
      socket.emit("joinQueue", { playerId: socket.id, username: "Player1" });
      displayWaitingScreen();
      return;
    }
    if (
      mouseX >= centerX &&
      mouseX <= centerX + buttonWidth &&
      mouseY >= shopButtonY &&
      mouseY <= shopButtonY + buttonHeight
    ) {
      canvas.removeEventListener('click', onClick);
      displayShopMenu();
      return;
    }
  };
  canvas.addEventListener('click', onClick);
}

export function displayShopMenu(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  interface SkinOption {
    name: string;
    image: string;
  }
  
  const options: SkinOption[] = [
    { name: 'Skin1', image: '/scripts/games/pong/assets/skin1.png' },
    { name: 'Skin2', image: '/scripts/games/pong/assets/skin2.png' },
    { name: 'Skin3', image: '/scripts/games/pong/assets/skin3.png' }
  ];
  
  const buttonSize = 100;
  const spacing = 20;
  const totalWidth = options.length * buttonSize + (options.length - 1) * spacing;
  const startX = (canvas.width - totalWidth) / 2;
  const buttonY = canvas.height / 2 - buttonSize / 2;

  options.forEach((option, index) => {
    const x = startX + index * (buttonSize + spacing);
    const img = new Image();
    img.src = option.image;
    img.onload = () => {
      ctx.drawImage(img, x, buttonY, buttonSize, buttonSize);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, buttonY, buttonSize, buttonSize);
    };
  });

  const backWidth = 100;
  const backHeight = 40;
  const backX = 20;
  const backY = canvas.height - backHeight - 20;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(backX, backY, backWidth, backHeight);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Back', backX + backWidth / 2, backY + backHeight / 2);

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
