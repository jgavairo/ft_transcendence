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
    let leftPaddleY = canvas.height / 2 - paddleHeight / 2;
    let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    const ballRadius = 10;
    let ballSpeedX = 5;
    let ballSpeedY = 3;
    const paddleSpeed = 7;
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
        if (leftPaddleY < 0)
            leftPaddleY = 0;
        if (leftPaddleY + paddleHeight > canvas.height) {
            leftPaddleY = canvas.height - paddleHeight;
        }
        if (rightPaddleY < 0)
            rightPaddleY = 0;
        if (rightPaddleY + paddleHeight > canvas.height) {
            rightPaddleY = canvas.height - paddleHeight;
        }
    }
    function draw() {
        updatePaddles();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
        ctx.fillRect(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
            ballSpeedY = -ballSpeedY;
        }
        if (ballX - ballRadius < leftPaddleX + paddleWidth &&
            ballY > leftPaddleY &&
            ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }
        if (ballX + ballRadius > rightPaddleX &&
            ballY > rightPaddleY &&
            ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }
        requestAnimationFrame(draw);
    }
    draw();
}
