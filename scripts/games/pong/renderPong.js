import { ctx, setGameoverTrue, mySide, renderGameOverMessage, playerName, opponentName, playerNames } from "./pongGame.js";
import { explosion } from "./ballExplosion.js";
import { animateEnd } from "./menu/DisplayFinishGame.js";
;
const FLASH_FRAMES = 20; // nombre de frames de l’animation
const EXPANSION = 30; // de combien l’anneau s’agrandit
const MAX_ALPHA = 0.6; // opacité initiale
let prevLives = [];
let lifeFlashes = [];
const DEATH_FRAMES = 30; // frames totales de l’animation
const DEATH_EXP = 60; // expansion max du ring gris
let deathFlashes = [];
const CW = 1200;
const CH = 800;
const CX = CW / 2;
const CY = CH / 2;
const R = Math.min(CW, CH) / 2 - 45; // rayon du terrain
const P_TH = 12; // épaisseur des paddles
const ARC_HALF = Math.PI / 18; // demi-angle du paddle
let start = false;
export let forfait = false;
// Tableau de couleurs pour chaque joueur/raquette
const PADDLE_COLORS = [
    '#00eaff', // bleu-cyan
    '#ff00c8', // rose
    '#ffe156', // jaune
    '#7cff00', // vert (pour un 4e joueur éventuel)
];
// Dessine l'état de la partie Tri-Pong
export async function renderPong(state, isTournament = false) {
    //if alreadyPLayed = NOT DISPLAY TUTO
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
    if (prevLives.length === 0) {
        prevLives = state.paddles.map(p => p.lives);
    }
    state.paddles.forEach((p, i) => {
        if (prevLives[i] === 1 && p.lives === 0) {
            deathFlashes.push({ index: i, frame: 0 });
        }
        if (p.lives < prevLives[i]) {
            lifeFlashes.push({ index: i, frame: 0 });
        }
        prevLives[i] = p.lives;
    });
    // 4) paddles avec glow pour le tien - chaque raquette a sa couleur
    state.paddles.forEach((p, i) => {
        const phi = (typeof p.phi === 'number' ? p.phi : p.angle);
        const start = phi - ARC_HALF;
        const end = phi + ARC_HALF;
        const isMine = i === mySide;
        const paddleColor = p.lives > 0
            ? PADDLE_COLORS[i % PADDLE_COLORS.length]
            : '#888888';
        const death = deathFlashes.find(f => f.index === i);
        if (death) {
            const prog = death.frame / DEATH_FRAMES; // 0→1
            const radius = R + P_TH / 2 + 5 + prog * DEATH_EXP;
            const alpha = 1 - prog;
            // a) ring gris
            ctx.save();
            ctx.lineWidth = P_TH + 4;
            ctx.strokeStyle = `rgba(200,200,200,${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(CX, CY, radius, start, end);
            ctx.stroke();
            ctx.restore();
            // b) skull/ghost au bout de la raquette
            if (prog > 0.2 && prog < 1) {
                const angleMid = phi;
                const sx = CX + Math.cos(angleMid) * (radius - 10);
                const sy = CY + Math.sin(angleMid) * (radius - 10);
                drawSkull(ctx, sx, sy, (1 - prog) * 20); // taille qui décroît
            }
            death.frame++;
        }
        const flash = lifeFlashes.find(f => f.index === i);
        if (flash) {
            const progress = flash.frame / FLASH_FRAMES; // 0 → 1
            const radius = R + P_TH / 2 + 5 + progress * EXPANSION;
            const alpha = (1 - progress) * MAX_ALPHA;
            ctx.save();
            ctx.lineWidth = P_TH + 4;
            ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
            ctx.beginPath();
            ctx.arc(CX, CY, radius, start, end);
            ctx.stroke();
            ctx.restore();
            flash.frame++;
        }
        ctx.save();
        ctx.lineWidth = P_TH;
        ctx.strokeStyle = paddleColor;
        ctx.shadowBlur = isMine ? 30 : 20;
        ctx.shadowColor = paddleColor;
        ctx.beginPath();
        ctx.arc(CX, CY, R, start, end);
        ctx.stroke();
        ctx.restore();
    });
    deathFlashes = deathFlashes.filter(f => f.frame < DEATH_FRAMES);
    lifeFlashes = lifeFlashes.filter(f => f.frame < FLASH_FRAMES);
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
    // 6) vies (cœurs) et noms combinés dans un seul bloc - plus petit et plus sobre
    const marginLeft = 20;
    const marginTop = 18;
    const blockHeight = 36;
    const blockSpacing = 8;
    state.paddles.forEach((p, i) => {
        const isMine = i === mySide;
        const paddleColor = PADDLE_COLORS[i % PADDLE_COLORS.length];
        const name = (typeof playerNames !== 'undefined' && playerNames.length === state.paddles.length)
            ? playerNames[i]
            : (isMine ? playerName : opponentName);
        ctx.save();
        ctx.font = '600 14px "Segoe UI", Arial, sans-serif';
        const textWidth = ctx.measureText(name).width;
        const heartsWidth = 3 * 16 + 2 * 6; // 3 cœurs, 6px espace
        const blockWidth = Math.max(textWidth + 16 + heartsWidth, 110);
        const blockX = marginLeft;
        const blockY = marginTop + i * (blockHeight + blockSpacing);
        // Fond sobre, couleur paddle très translucide, coins peu arrondis
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = hexToRgba(paddleColor, 0.60);
        roundRect(ctx, blockX, blockY, blockWidth, blockHeight, 7);
        ctx.globalAlpha = 1;
        // Bordure fine
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255,255,255,0.13)';
        roundRectStroke(ctx, blockX, blockY, blockWidth, blockHeight, 7);
        ctx.restore();
        // Texte
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 1.5;
        ctx.shadowColor = 'rgba(0,0,0,0.13)';
        ctx.fillText(name, blockX + 8, blockY + blockHeight / 2);
        // Cœurs, centrés verticalement, à droite du nom
        const heartsX = blockX + 8 + textWidth + 10;
        const heartsY = blockY + blockHeight / 2;
        for (let h = 0; h < 3; h++) {
            drawHeart(heartsX + h * 16, heartsY, 10, h < p.lives);
        }
        ctx.restore();
    });
    // 7) overlay game over
    if (state.gameOver) {
        if (isTournament) {
            // → Si on est en tournoi, on ne fait PAS l'animation de fin.
            //    On retourne directement, le client tournament prendra le relais
            //    (nettoyera le menu + retour au lobby).
            return;
        }
        // -- Sinon, on est en mode solo/2-players classique : on joue l'animation de fin --
        setGameoverTrue();
        // a) trouver l'indice du gagnant (première raquette dont lives > 0)
        const winnerIndex = state.paddles.findIndex(pl => pl.lives > 0);
        const padColor = PADDLE_COLORS[winnerIndex % PADDLE_COLORS.length];
        const winnerName = (Array.isArray(playerNames) && playerNames.length === state.paddles.length)
            ? playerNames[winnerIndex]
            : (winnerIndex === mySide ? playerName : opponentName);
        // b) on lance l’animation « animateEnd / displayEndMatch »
        animateEnd(winnerName, padColor);
        renderGameOverMessage(state);
        start = false; // pour remettre la particule en pause si besoin
        // on ne remonte pas plus haut
        return;
    }
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
// Ajout d'une fonction pour le contour arrondi
function roundRectStroke(ctx, x, y, width, height, radius) {
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
    ctx.stroke();
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
        const heartGradient = ctx.createRadialGradient(x, y + sz / 2, sz * 0.2, x, y + sz / 2, sz * 0.6);
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
// Ajout d'une fonction utilitaire pour convertir une couleur hex en rgba avec alpha
function hexToRgba(hex, alpha) {
    // Enlève le # si présent
    hex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    }
    else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}
function drawSkull(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 50, size / 50); // base 50px
    // Crâne
    ctx.beginPath();
    ctx.arc(0, 0, 20, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.quadraticCurveTo(20, 30, 0, 40);
    ctx.quadraticCurveTo(-20, 30, -20, 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(220,220,220,0.9)';
    ctx.fill();
    // Yeux
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-8, 10, 4, 0, Math.PI * 2);
    ctx.arc(8, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    // Croix d’os sous le crâne
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(180,180,180,0.8)';
    ctx.beginPath();
    ctx.moveTo(-25, 35);
    ctx.lineTo(25, 35);
    ctx.moveTo(0, 25);
    ctx.lineTo(0, 45);
    ctx.stroke();
    ctx.restore();
}
