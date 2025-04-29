import { io } from 'socket.io-client';
import { displayMenu } from './DisplayMenu.js';
import { displayWaitingScreen } from './WaitingScreen.js';
import { connectTriPong } from './TriPong.js';
export const HOSTNAME = window.location.hostname;
export const socket = io(`http://${HOSTNAME}:3000/game`, {
    withCredentials: true,
});
connectTriPong();
socket.on('connect', () => {
});
export let mode = 'multi';
export function setMode(m) { mode = m; }
export let mySide = 'left';
socket.on('matchFound', ({ roomId, side }) => {
    if (mode == 'solo') {
        mySide = 'left';
    }
    else {
        mySide = side;
    }
    if (mode == 'multi') {
        displayWaitingScreen();
    }
});
socket.on('gameState', (state) => {
    renderGame(state);
    // Vérifiez si la partie est terminée
    if (state.leftLives === 0 || state.rightLives === 0) {
        const winnerId = state.leftLives > 0 ? state.leftPlayerId : state.rightPlayerId;
        const gameId = state.gameId; // Assurez-vous que l'ID du jeu est inclus dans l'état
        socket.emit('gameOver', { winnerId, gameId });
    }
});
export let selectedPaddleColor = 'white';
export function setSelectedPaddleColor(c) { selectedPaddleColor = c; }
const paddleSkinImages = {
    Skin1: new Image(),
    Skin2: new Image(),
    Skin3: new Image()
};
paddleSkinImages.Skin1.src = '/scripts/games/pong/assets/skin1.png';
paddleSkinImages.Skin2.src = '/scripts/games/pong/assets/skin2.png';
paddleSkinImages.Skin3.src = '/scripts/games/pong/assets/skin3.png';
export const bgImage = new Image();
bgImage.src = '/scripts/games/pong/assets/background.png';
export const menuBg = new Image();
menuBg.src = '/scripts/games/pong/assets/menuBg.png';
export const shopBg = new Image();
shopBg.src = '/scripts/games/pong/assets/shopBg.png';
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
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        socket.emit("movePaddle", { paddle: "right", direction: null });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    displayMenu();
});
window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape')
        return;
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    if (modal.innerHTML.trim() !== '') {
        modal.innerHTML = '';
        displayMenu();
    }
});
