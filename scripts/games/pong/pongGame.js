import io from 'socket.io-client';
console.log("Début de l'exécution du fichier pongGame.ts");
const socket = io('http://127.0.0.1:3000/game', {
    transports: ['websocket', 'polling'],
    withCredentials: true
});
socket.on("matchFound", (data) => {
    console.log("Match found!", data);
});
socket.on("gameState", (matchState) => {
    renderGame(matchState);
});
let selectedPaddleColor = 'white';
const paddleSkinImages = {
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
let loadingReqId = null;
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
    const totalLives = 5;
    if (loadingReqId !== null)
        cancelAnimationFrame(loadingReqId);
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
function renderGame(matchState) {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    ctx.clearRect(0, 0, cw, ch);
    if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, cw, ch);
    }
    else {
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
    }
    else {
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
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        socket.emit("movePaddle", { paddle: "right", direction: null });
    }
});
function displayWaitingScreen() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
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
function animateSpinner() {
    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');
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
export function displayMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    if (menuBg.complete) {
        ctx.drawImage(menuBg, 0, 0, cw, ch);
    }
    else {
        menuBg.onload = () => {
            ctx.drawImage(menuBg, 0, 0, cw, ch);
        };
    }
    const buttonWidth = 300;
    const buttonHeight = 100;
    const playY = ch / 2 - 60;
    const shopY = ch / 2 + 90;
    const centerX = (cw - buttonWidth) / 2 - 10;
    const handler = (e) => {
        const { left, top } = canvas.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        if (x >= centerX && x <= centerX + buttonWidth) {
            if (y >= playY && y <= playY + buttonHeight) {
                canvas.removeEventListener('click', handler);
                socket.emit('joinQueue', { playerId: socket.id, username: 'Player1' });
                displayWaitingScreen();
            }
            else if (y >= shopY && y <= shopY + buttonHeight) {
                canvas.removeEventListener('click', handler);
                displayShopMenu();
            }
        }
    };
    canvas.addEventListener('click', handler);
}
export function displayShopMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const options = [
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
    }
    else {
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
                selectedPaddleColor = option.name;
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
document.addEventListener('DOMContentLoaded', () => {
    displayMenu();
});
