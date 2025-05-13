import { ctx, setGameoverTrue, mySide, renderGameOverMessage, playerName, opponentName, playerNames } from "./pongGame.js";
import { explosion } from "./ballExplosion.js";
import { animateGameOver, animateWin } from "./menu/DisplayFinishGame.js";
import { displayParticles } from "./menu/DisplayMenu.js";
const CW = 1200;
const CH = 800;
const CX = CW / 2;
const CY = CH / 2;
const R = Math.min(CW, CH) / 2 - 45; // rayon du terrain
const P_TH = 12; // épaisseur des paddles
const ARC_HALF = Math.PI / 18; // demi-angle du paddle
let start = false;
// Dessine l'état de la partie Tri-Pong
export function renderPong(state) {
    var _a, _b;
    // 1) motion blur: on dessine un calque semi-transparent au lieu de tout clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, CW, CH);
    // 2) fond radial
    const grd = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R);
    grd.addColorStop(0, '#00111a');
    grd.addColorStop(1, '#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, CW, CH);
    if (!start)
        displayParticles();
    start = true;
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
    // 4) paddles avec glow pour le tien - Style amélioré avec effet de dégradé
    state.paddles.forEach((p, i) => {
        const phi = (typeof p.phi === 'number' ? p.phi : p.angle);
        const start = phi - ARC_HALF;
        const end = phi + ARC_HALF;
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
    // 6) vies (cœurs) et noms combinés dans un seul bloc - Style amélioré
    state.paddles.forEach((p, i) => {
        const isMine = i === mySide;
        const baseRadius = R + 30; // Augmenté légèrement pour plus d'espace
        const phi = typeof p.phi === 'number' ? p.phi : p.angle;
        // Position de base pour le bloc d'informations
        const basePos = fromPolar(phi, baseRadius);
        // Assurons-nous que le bloc reste à l'intérieur de la fenêtre
        const margin = 30;
        const blockX = Math.max(margin, Math.min(CW - margin, basePos.x));
        const blockY = Math.max(margin, Math.min(CH - margin, basePos.y));
        // Utiliser le nom du joueur correspondant (TriPong)
        const name = (typeof playerNames !== 'undefined' && playerNames.length === state.paddles.length)
            ? playerNames[i]
            : (isMine ? playerName : opponentName);
        ctx.save();
        // Police améliorée pour meilleure lisibilité
        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        const textWidth = ctx.measureText(name).width;
        const blockWidth = Math.max(textWidth, 3 * 25) + 20; // Légèrement plus large
        const blockHeight = 55; // Légèrement plus haut
        // Fond semi-transparent avec coins arrondis
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        roundRect(ctx, blockX - blockWidth / 2, blockY - blockHeight / 2, blockWidth, blockHeight, 8 // Rayon des coins arrondis
        );
        // Dessiner le nom avec ombre portée pour meilleure lisibilité
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        // Dégradé pour le texte du nom
        if (isMine) {
            const textGradient = ctx.createLinearGradient(blockX - textWidth / 2, blockY - 12, blockX + textWidth / 2, blockY - 12);
            textGradient.addColorStop(0, '#FFD700'); // Or
            textGradient.addColorStop(0.5, '#FFF380'); // Or plus clair
            textGradient.addColorStop(1, '#FFD700'); // Or
            ctx.fillStyle = textGradient;
        }
        else {
            const textGradient = ctx.createLinearGradient(blockX - textWidth / 2, blockY - 12, blockX + textWidth / 2, blockY - 12);
            textGradient.addColorStop(0, '#FF69B4'); // Rose vif
            textGradient.addColorStop(0.5, '#FFB6C1'); // Rose clair
            textGradient.addColorStop(1, '#FF69B4'); // Rose vif
            ctx.fillStyle = textGradient;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, blockX, blockY - 12);
        // Réinitialiser l'ombre pour les cœurs
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        // Dessiner les cœurs en bas du bloc - Plus grands et mieux espacés
        for (let h = 0; h < 3; h++) {
            drawHeart(blockX + (h - 1) * 26, blockY + 12, 13, h < p.lives);
        }
        ctx.restore();
        // 7) overlay game over
    });
    if (state.gameOver) {
        setGameoverTrue();
        // si c'est un match solo, on peut toujours considérer un "win" pour le seul joueur
        const myLives = (_b = (_a = state.paddles[mySide]) === null || _a === void 0 ? void 0 : _a.lives) !== null && _b !== void 0 ? _b : 0;
        if (myLives > 0) {
            animateWin();
        }
        else {
            animateGameOver();
        }
        renderGameOverMessage(state);
        start = false; // pour remettre la particule en pause si tu veux
        //   setTimeout(() => {
        //     showGameOverOverlay();
        //   }, 1500);
        return; // on arrête le render ici
    }
}
// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi, r) {
    return {
        x: CX + r * Math.cos(phi),
        y: CY + r * Math.sin(phi),
    };
}
// Ajout d'une fonction pour dessiner des rectangles arrondis
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}
// Dessine un cœur (pour les vies) - Version améliorée avec dégradé
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
    if (fill) {
        // Créer un dégradé pour le cœur rempli
        const heartGradient = ctx.createRadialGradient(x, y + sz / 2, sz * 0.2, x, y + sz / 2, sz * 1.2);
        heartGradient.addColorStop(0, '#FF5555'); // Rouge plus clair
        heartGradient.addColorStop(0.7, '#FF0000'); // Rouge
        heartGradient.addColorStop(1, '#CC0000'); // Rouge plus foncé
        ctx.fillStyle = heartGradient;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.5)';
        ctx.fill();
    }
    // Contour plus élégant
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = fill ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();
    ctx.restore();
}
