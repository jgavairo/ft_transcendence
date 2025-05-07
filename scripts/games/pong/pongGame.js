import { displayMenu } from './DisplayMenu.js';
import { socket } from './network.js';
import { createExplosion, explosion, animateGameOver } from './ballExplosion.js';
import { showGameOverOverlay } from './DisplayFinishGame.js';
// Variables réseau
let mySide;
let roomId;
let soloMode = false;
// Canvas et contexte
let canvas;
export let ctx;
// Constantes de rendu (synchronisées avec le serveur)
const CW = 1185;
const CH = 785;
const CX = CW / 2;
const CY = CH / 2;
const R = Math.min(CW, CH) / 2 - 45; // rayon du terrain
const P_TH = 12; // épaisseur des paddles
const ARC_HALF = Math.PI / 18; // demi-angle du paddle
let ready = false; // on ne dessine qu'une fois le countdown fini
let lastState = null;
let firstFrame = false;
export let gameover = false;
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
// Initialise la connexion Socket.IO et les handlers
export function connectPong() {
    socket.on('matchFound', (data) => {
        soloMode = data.mode === 'solo';
        mySide = soloMode ? 0 : data.side;
        lastState = null;
        ready = false;
        firstFrame = false;
        startPong();
        performCountdown().then(() => {
            ready = true;
        });
    });
    socket.on('gameState', (state) => {
        lastState = state;
        // on n'affiche jamais avant que ready soit true
        if (!ready)
            return;
        // si c'est la toute première frame, on la met en attente 500 ms
        if (!firstFrame) {
            firstFrame = true;
            setTimeout(() => {
                renderPong(state);
            }, 500);
        }
        else {
            // toutes les autres frames passent directement
            renderPong(state);
        }
    });
}
async function performCountdown() {
    // Si on a déjà un état, on le stocke pour le flouter
    const backupState = lastState;
    const duration = 1000; // durée de chaque animation en ms
    for (const num of [3, 2, 1]) {
        await animateNumber(num, backupState, duration);
    }
    // courte pause après le "1"
    return new Promise(res => setTimeout(res, 200));
}
function animateNumber(num, bgState, duration) {
    return new Promise(resolve => {
        const start = performance.now();
        function frame(now) {
            const t = Math.min(1, (now - start) / duration);
            // scale : monte de 1→1.5 puis redescend à 1
            const scale = 1 + 0.5 * Math.sin(Math.PI * t);
            // 1) efface tout
            ctx.clearRect(0, 0, CW, CH);
            // 2) floute et redessine l’arrière-plan
            if (bgState) {
                ctx.filter = 'blur(5px)';
                renderPong(bgState);
                ctx.filter = 'none';
            }
            // 3) dessine le chiffre animé
            ctx.save();
            ctx.translate(CX, CY);
            ctx.scale(scale, scale);
            ctx.fillStyle = 'white';
            ctx.font = '100px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(num), 0, 0);
            ctx.restore();
            if (t < 1) {
                requestAnimationFrame(frame);
            }
            else {
                resolve();
            }
        }
        requestAnimationFrame(frame);
    });
}
export function joinQueue(username) {
    socket.emit('joinQueue', { username });
}
export function startSoloPong(username) {
    socket.emit('startSolo', { username });
}
// Envoi des commandes paddle au serveur
function sendMove(side, direction) {
    socket.emit('movePaddle', { side, direction });
}
// En haut du fichier
function onKeyDown(e) {
    if (!ready || gameover)
        return;
    if (soloMode) {
        if (e.code === 'KeyD')
            sendMove(0, 'up');
        else if (e.code === 'KeyA')
            sendMove(0, 'down');
        else if (e.code === 'ArrowRight')
            sendMove(1, 'up');
        else if (e.code === 'ArrowLeft')
            sendMove(1, 'down');
    }
    else {
        if (e.code === 'KeyD' || e.code === 'KeyA') {
            const dir = e.code === 'KeyD' ? 'up' : 'down';
            sendMove(mySide, dir);
        }
    }
}
function onKeyUp(e) {
    if (!ready || gameover)
        return;
    if (soloMode) {
        if (e.code === 'KeyD' || e.code === 'KeyA')
            sendMove(0, null);
        else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft')
            sendMove(1, null);
    }
    else {
        if (e.code === 'KeyD' || e.code === 'KeyA')
            sendMove(mySide, null);
    }
}
// Initialise le canvas et le contexte
export function startPong() {
    canvas = document.querySelector('#pongCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CW;
    canvas.height = CH;
}
function endPong() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
}
// Dessine l'état de la partie Tri-Pong
export function renderPong(state) {
    // 1) motion blur: on dessine un calque semi-transparent au lieu de tout clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, CW, CH);
    // 2) fond radial
    const grd = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R);
    grd.addColorStop(0, '#00111a');
    grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CW, CH);
    // 3) bordure de la map
    ctx.save();
    ctx.strokeStyle = 'rgba(0,174,255,0.8)';
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0,174,255,0.5)';
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // 4) paddles avec glow pour le tien
    state.paddles.forEach((p, i) => {
        const start = p.phi - ARC_HALF;
        const end = p.phi + ARC_HALF;
        const isMine = i === mySide;
        ctx.save();
        ctx.lineWidth = P_TH;
        ctx.strokeStyle = isMine
            ? 'cyan'
            : 'rgb(255, 0, 200)';
        // : (p.lives > 0 ? '#eee' : 'red');
        ctx.shadowBlur = isMine ? 30 : 20;
        ctx.shadowColor = isMine ? 'cyan' : 'rgb(255, 0, 200)';
        ctx.beginPath();
        ctx.arc(CX, CY, R, start, end);
        ctx.stroke();
        ctx.restore();
    });
    // 5) balle avec ombre portée
    const bx = CX + state.ball.x;
    const by = CY + state.ball.y;
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'white';
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    explosion.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    // 6) vies (cœurs) avec effet de scale
    state.paddles.forEach((p, i) => {
        const label = fromPolar(p.phi, R + 25);
        for (let h = 0; h < 3; h++) {
            drawHeart(label.x + (h - 1) * 24, label.y, 12, h < p.lives);
        }
    });
    // 7) overlay game over
    if (state.gameOver) {
        gameover = true;
        animateGameOver();
        setTimeout(() => {
            showGameOverOverlay();
        }, 1500);
        return;
    }
}
// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi, r) {
    return {
        x: CX + r * Math.cos(phi),
        y: CY + r * Math.sin(phi),
    };
}
// Dessine un cœur (pour les vies)
function drawHeart(x, y, sz, fill) {
    ctx.save();
    ctx.beginPath();
    const t = sz * 0.3;
    ctx.moveTo(x, y + t);
    ctx.bezierCurveTo(x, y, x - sz / 2, y, x - sz / 2, y + t);
    ctx.bezierCurveTo(x - sz / 2, y + (sz + t) / 2, x, y + (sz + t) / 2, x, y + sz);
    ctx.bezierCurveTo(x, y + (sz + t) / 2, x + sz / 2, y + (sz + t) / 2, x + sz / 2, y + t);
    ctx.bezierCurveTo(x + sz / 2, y, x, y, x, y + t);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    if (fill) {
        ctx.fillStyle = 'red';
        ctx.fill();
    }
    ctx.restore();
}
// A simple particle‐based explosion with random colors & sizes
// Listen for server burst
socket.on('ballExplode', ({ x, y }) => {
    createExplosion(x, y);
});
export function resetGame() {
    ready = false;
    gameover = false;
    firstFrame = false;
    lastState = null;
    explosion.length = 0;
    displayMenu();
}
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
