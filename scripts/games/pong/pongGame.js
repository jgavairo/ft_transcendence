let selectedPaddleColor = 'white';
export function displayMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
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
    const onClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (mouseX >= centerX &&
            mouseX <= centerX + buttonWidth &&
            mouseY >= playButtonY &&
            mouseY <= playButtonY + buttonHeight) {
            canvas.removeEventListener('click', onClick);
            startPong();
            return;
        }
        if (mouseX >= centerX &&
            mouseX <= centerX + buttonWidth &&
            mouseY >= shopButtonY &&
            mouseY <= shopButtonY + buttonHeight) {
            canvas.removeEventListener('click', onClick);
            displayShopMenu();
            return;
        }
    };
    canvas.addEventListener('click', onClick);
}
export function displayShopMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const options = [
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
    const onClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        options.forEach((option, index) => {
            const x = startX + index * (buttonSize + spacing);
            if (mouseX >= x &&
                mouseX <= x + buttonSize &&
                mouseY >= buttonY &&
                mouseY <= buttonY + buttonSize) {
                selectedPaddleColor = option.color;
                canvas.removeEventListener('click', onClick);
                displayMenu();
            }
        });
        if (mouseX >= backX &&
            mouseX <= backX + backWidth &&
            mouseY >= backY &&
            mouseY <= backY + backHeight) {
            canvas.removeEventListener('click', onClick);
            displayMenu();
        }
    };
    canvas.addEventListener('click', onClick);
}
function drawHeart(ctx, x, y, size, filled) {
    ctx.save();
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
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
function drawLives(ctx, canvas, leftLives, rightLives) {
    const heartSize = 20;
    const gap = 10;
    const leftStartX = 20;
    const leftY = 20;
    for (let i = 0; i < 5; i++) {
        const filled = i < leftLives;
        drawHeart(ctx, leftStartX + i * (heartSize + gap) + heartSize / 2, leftY, heartSize, filled);
    }
    const rightY = 20;
    const rightStartX = canvas.width - 20 - 5 * (heartSize + gap) + gap;
    for (let i = 0; i < 5; i++) {
        const filled = i < rightLives;
        drawHeart(ctx, rightStartX + i * (heartSize + gap) + heartSize / 2, rightY, heartSize, filled);
    }
}
function displayWinScreen(winner) {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2);
    const buttonWidth = 150;
    const buttonHeight = 50;
    const centerX = (canvas.width - buttonWidth) / 2;
    const menuButtonY = canvas.height / 2 + 60;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX, menuButtonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Menu', centerX + buttonWidth / 2, menuButtonY + buttonHeight / 2);
    const onClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (mouseX >= centerX &&
            mouseX <= centerX + buttonWidth &&
            mouseY >= menuButtonY &&
            mouseY <= menuButtonY + buttonHeight) {
            canvas.removeEventListener('click', onClick);
            displayMenu();
        }
    };
    canvas.addEventListener('click', onClick);
}
export function startPong() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
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
    let ballSpeedX = 6;
    let ballSpeedY = 3;
    let leftLives = 5;
    let rightLives = 5;
    let gameOver = false;
    let winner = '';
    const keys = {};
    window.addEventListener('keydown', (event) => { keys[event.key] = true; });
    window.addEventListener('keyup', (event) => { keys[event.key] = false; });
    function updatePaddles() {
        if (keys['w'] || keys['W'])
            leftPaddleY -= paddleSpeed;
        if (keys['s'] || keys['S'])
            leftPaddleY += paddleSpeed;
        if (keys['ArrowUp'])
            rightPaddleY -= paddleSpeed;
        if (keys['ArrowDown'])
            rightPaddleY += paddleSpeed;
        leftPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, leftPaddleY));
        rightPaddleY = Math.max(0, Math.min(canvas.height - paddleHeight, rightPaddleY));
    }
    function updateBall() {
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0)
            ballSpeedY = -ballSpeedY;
        if (ballX - ballRadius < leftPaddleX + paddleWidth &&
            ballY > leftPaddleY &&
            ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            ballSpeedY += 1;
        }
        if (ballX + ballRadius > rightPaddleX &&
            ballY > rightPaddleY &&
            ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            ballSpeedY += 1;
        }
        if (ballX - ballRadius < 0) {
            leftLives--;
            resetBall();
        }
        else if (ballX + ballRadius > canvas.width) {
            rightLives--;
            resetBall();
        }
        if (leftLives <= 0 || rightLives <= 0) {
            gameOver = true;
            winner = leftLives <= 0 ? 'Right Player' : 'Left Player';
        }
    }
    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
        ballSpeedY = 3;
    }
    function drawPaddles() {
        ctx.fillStyle = selectedPaddleColor;
        ctx.fillRect(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
    }
    function drawBall() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    function drawLivesWrapper() {
        drawLives(ctx, canvas, leftLives, rightLives);
    }
    function draw() {
        updatePaddles();
        updateBall();
        if (gameOver) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            displayWinScreen(winner);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPaddles();
        drawBall();
        drawLivesWrapper();
        requestAnimationFrame(draw);
    }
    draw();
}
document.addEventListener('DOMContentLoaded', () => {
    displayMenu();
});
