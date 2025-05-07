import { socket } from './network.js';
import { createExplosion } from './ballExplosion.js';
// Variables réseau
let mySide = -1;
let roomId;
// Canvas et contexte
let canvas;
let ctx;
// Constantes de rendu (synchronisées avec le serveur)
const CW = 1185;
const CH = 785;
const CX = CW / 2;
const CY = CH / 2;
const R = Math.min(CW, CH) / 2 - 45; // rayon du terrain
const P_TH = 12; // épaisseur des paddles
const ARC_HALF = Math.PI / 18; // demi-angle du paddle
let readyTri = false;
let firstFrameTri = false;
let lastTriState = null;
// Initialise la connexion Socket.IO et les handlers
export function connectTriPong() {
    socket.on('matchFoundTri', (data) => {
        roomId = data.roomId;
        mySide = data.side;
        lastTriState = null;
        readyTri = false;
        firstFrameTri = false;
        startTriPong();
        performCountdown().then(() => {
            readyTri = true;
        });
    });
    socket.on('stateUpdateTri', (state) => {
        lastTriState = state;
        // on n'affiche jamais avant que ready soit true
        if (!readyTri)
            return;
        // si c'est la toute première frame, on la met en attente 500 ms
        if (!firstFrameTri) {
            firstFrameTri = true;
            setTimeout(() => {
                renderTriPong(state);
            }, 500);
        }
        else {
            // toutes les autres frames passent directement
            renderTriPong(state);
        }
    });
}
async function performCountdown() {
    // Si on a déjà un état, on le stocke pour le flouter
    const backupState = lastTriState;
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
                renderTriPong(bgState);
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
export function joinTriQueue(username) {
    socket.emit('joinTriQueue', { username });
}
export function startSoloTriPong(username) {
    socket.emit('startSoloTri', { username });
}
// Envoi des commandes paddle au serveur
function sendMove(side, direction) {
    socket.emit('movePaddleTri', { side, direction });
}
// Écoute clavier global
window.addEventListener('keydown', (e) => {
    if (mySide >= 0) {
        // —— mode multi-tri : votre player (mySide) se déplace avec W/S seulement
        if (e.code === 'KeyD') {
            sendMove(mySide, 'up');
        }
        else if (e.code === 'KeyA') {
            sendMove(mySide, 'down');
        }
    }
    else {
        // —— mode solo-tri : un seul joueur pilote tout, on garde W/S, I/K, flèches
        if (['KeyD', 'KeyA', 'KeyL', 'KeyJ', 'ArrowRight', 'ArrowLeft'].includes(e.code)) {
            let side;
            if (['KeyA', 'KeyD'].includes(e.code))
                side = 0;
            else if (['KeyJ', 'KeyL'].includes(e.code))
                side = 1;
            else /* arrows */
                side = 2;
            const dir = (e.code === 'KeyD' || e.code === 'KeyL' || e.code === 'ArrowRight')
                ? 'up' : 'down';
            sendMove(side, dir);
        }
    }
});
window.addEventListener('keyup', (e) => {
    if (mySide >= 0) {
        // —— multi-tri : on arrête toujours avec W/S
        if (e.code === 'KeyD' || e.code === 'KeyA') {
            sendMove(mySide, null);
        }
    }
    else {
        // —— solo-tri : on arrête le paddle correspondant
        if (['KeyD', 'KeyA', 'KeyL', 'KeyJ', 'ArrowRight', 'ArrowLeft'].includes(e.code)) {
            let side;
            if (['KeyD', 'KeyA'].includes(e.code))
                side = 0;
            else if (['KeyL', 'KeyJ'].includes(e.code))
                side = 1;
            else /* arrows */
                side = 2;
            sendMove(side, null);
        }
    }
});
// Initialise le canvas et le contexte
export function startTriPong() {
    canvas = document.querySelector('#pongCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CW;
    canvas.height = CH;
}
export function renderTriPong(state) {
    // 1) slight motion-blur background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, CW, CH);
    // 2) radial gradient floor
    const grd = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R);
    grd.addColorStop(0, '#00111a');
    grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CW, CH);
    // 3) glowing map border
    ctx.save();
    ctx.strokeStyle = 'rgba(0,174,255,0.8)';
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0,174,255,0.5)';
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // 4) draw the three paddles, with a glow on yours
    state.paddles.forEach((p, i) => {
        const start = p.phi - ARC_HALF;
        const end = p.phi + ARC_HALF;
        const isMine = (i === mySide);
        ctx.save();
        ctx.lineWidth = P_TH;
        ctx.strokeStyle = isMine ? 'cyan' : (p.lives > 0 ? 'white' : 'red');
        if (isMine) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = 'cyan';
        }
        ctx.beginPath();
        ctx.arc(CX, CY, R, start, end);
        ctx.stroke();
        ctx.restore();
    });
    // 5) ball with soft glow
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
    // 6) static hearts for lives
    state.paddles.forEach((p, i) => {
        const label = fromPolar(p.phi, R + 25);
        for (let h = 0; h < 3; h++) {
            drawHeart(label.x + (h - 1) * 24, label.y, 12, h < p.lives);
        }
    });
    // 7) game-over overlay
    if (state.gameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px Arial';
        ctx.fillText('Game Finish', CX, CY);
        ctx.restore();
    }
}
let explosion = [];
// Listen for server burst
socket.on('ballExplode', ({ x, y }) => {
    createExplosion(x, y);
});
// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi, r) {
    return {
        x: CX + r * Math.cos(phi),
        y: CY + r * Math.sin(phi)
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
