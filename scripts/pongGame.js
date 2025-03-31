export function displayMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const squareSize = 150;
    const squareX = (canvas.width - squareSize) / 2;
    const squareY = (canvas.height - squareSize) / 2;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(squareX, squareY, squareSize, squareSize);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Play', squareX + squareSize / 2, squareY + squareSize / 2);
    canvas.addEventListener('click', function onClick(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (mouseX >= squareX &&
            mouseX <= squareX + squareSize &&
            mouseY >= squareY &&
            mouseY <= squareY + squareSize) {
            canvas.removeEventListener('click', onClick);
            startPong();
        }
    });
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
    let ballSpeedX = 5;
    let ballSpeedY = 3;
    let leftScore = 0;
    let rightScore = 0;
    const keys = {};
    window.addEventListener('keydown', (event) => {
        keys[event.key] = true;
    });
    window.addEventListener('keyup', (event) => {
        keys[event.key] = false;
    });
    function updatePaddles() {
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
    function updateBall() {
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
            ballSpeedY = -ballSpeedY;
        }
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
            rightScore++;
            resetBall();
        }
        else if (ballX + ballRadius > canvas.width) {
            leftScore++;
            resetBall();
        }
    }
    function resetBall() {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
        ballSpeedY = 3;
    }
    function drawPaddles() {
        ctx.fillStyle = 'white';
        ctx.fillRect(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
    }
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    function drawScore() {
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${leftScore} - ${rightScore}`, canvas.width / 2, 40);
    }
    function draw() {
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
