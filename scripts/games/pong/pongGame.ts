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

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cw, ch);

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

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${matchState.leftScore} - ${matchState.rightScore}`, canvas.width / 2, 40);
}

function displayWaitingScreen(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Waiting for opponent...', canvas.width / 2, canvas.height / 2);
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
