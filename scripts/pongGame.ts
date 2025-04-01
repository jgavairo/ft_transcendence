let selectedPaddleColor: string = 'white';

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
      startPong();
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
  interface ColorOption {
    name: string;
    color: string;
  }
  const options: ColorOption[] = [
    { name: 'Blue', color: 'blue' },
    { name: 'Red', color: 'red' },
    { name: 'Green', color: 'green' }
  ];
  const buttonSize = 100;
  const spacing = 20;
  const totalWidth = options.length * buttonSize + (options.length - 1) * spacing;
  const startX = (canvas.width - totalWidth) / 2;
  const buttonY = canvas.height / 2 - buttonSize / 2;
  options.forEach((option, index) => {
    const x = startX + index * (buttonSize + spacing);
    ctx.fillStyle = option.color;
    ctx.fillRect(x, buttonY, buttonSize, buttonSize);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, buttonY, buttonSize, buttonSize);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.name, x + buttonSize / 2, buttonY + buttonSize / 2);
  });
  const backWidth = 100;
  const backHeight = 40;
  const backX = 20;
  const backY = canvas.height - backHeight - 20;
  ctx.strokeStyle = 'white';
  ctx.strokeRect(backX, backY, backWidth, backHeight);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
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
        selectedPaddleColor = option.color;
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

export function startPong(): void {
  const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const paddleWidth = 10;
  const paddleHeight = 100;
  const leftPaddleX = 30;
  const rightPaddleX = canvas.width - 30 - paddleWidth;
  const ballRadius = 10;
  const paddleSpeed = 7;
  let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
  let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
  let ballX = canvas.width / 2;
  let ballY = canvas.height / 2;
  let ballSpeedX = 4;
  let ballSpeedY = 2;
  let leftScore = 0;
  let rightScore = 0;
  const keys: { [key: string]: boolean } = {};
  window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
  });
  window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
  });
  function updatePaddles(): void {
    if (keys['w'] || keys['W']) {
      leftPaddleY -= paddleSpeed;
    }
    if (keys['s'] || keys['S']) {
      leftPaddleY += paddleSpeed;
    }
    if (keys['ArrowUp']) {
      rightPaddleY -= paddleSpeed;
    }
    if (keys['ArrowDown']) {
      rightPaddleY += paddleSpeed;
    }
    leftPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddleY));
    rightPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddleY));
  }
  function updateBall(): void {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
      ballSpeedY = -ballSpeedY;
    }
    if (
      ballX - ballRadius < leftPaddleX + paddleWidth &&
      ballY > leftPaddleY &&
      ballY < leftPaddleY + paddleHeight
    ) {
      ballSpeedX = -ballSpeedX;
      ballSpeedY += 1;
    }
    if (
      ballX + ballRadius > rightPaddleX &&
      ballY > rightPaddleY &&
      ballY < rightPaddleY + paddleHeight
    ) {
      ballSpeedX = -ballSpeedX;
      ballSpeedY += 1;
    }
    if (ballX - ballRadius < 0) {
      rightScore++;
      resetBall();
    } else if (ballX + ballRadius > canvas.width) {
      leftScore++;
      resetBall();
    }
  }
  function resetBall(): void {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 3;
  }
  function drawPaddles(): void {
    ctx.fillStyle = selectedPaddleColor;
    ctx.fillRect(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
  }
  function drawBall(): void {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  function drawScore(): void {
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${leftScore} - ${rightScore}`, canvas.width / 2, 40);
  }
  function draw(): void {
    updatePaddles();
    updateBall();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPaddles();
    drawBall();
    drawScore();
    requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  displayMenu();
});
