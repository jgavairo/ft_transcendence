import { displayMenu } from './DisplayMenu.js';
import { socket } from './network.js';
import { GameManager } from '../../managers/gameManager.js'; // Import de GameManager
import { createExplosion, explosion, animateGameOver } from './ballExplosion.js';

// Interface de l'état de partie reçue du serveur
export interface MatchState {
  roomId: string;
  paddles: { phi: number; lives: number }[];
  ball: { x: number; y: number };
  gameOver: boolean;
}

// Variables réseau
let mySide: number;
let roomId: string;
let soloMode = false;

// Canvas et contexte
let canvas: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

// Constantes de rendu (synchronisées avec le serveur)
const CW = 1185;
const CH = 785;
const CX = CW / 2;
const CY = CH / 2;
const R  = Math.min(CW, CH) / 2 - 45;      // rayon du terrain
const P_TH = 12;                           // épaisseur des paddles
const ARC_HALF = Math.PI / 18;      // demi-angle du paddle

let ready = false;  // on ne dessine qu'une fois le countdown fini
let lastState: MatchState | null = null;
let firstFrame = false;

export let gameover = false;

// Initialise la connexion Socket.IO et les handlers
export function connectPong() {
  socket.on('matchFound', (data) => {
    soloMode = data.mode === 'solo';
    mySide   = soloMode ? 0 : data.side;
    lastState = null;
    ready = false;
    firstFrame = false;

    startPong();
    performCountdown().then(() => {
      ready = true;
    });
  });

  socket.on('gameState', (state: MatchState) => {
    lastState = state;

    // on n'affiche jamais avant que ready soit true
    if (!ready) return;

    // si c'est la toute première frame, on la met en attente 500 ms
    if (!firstFrame) {
      firstFrame = true;
      setTimeout(() => {
        renderPong(state);
      }, 500);
    } else {
      // toutes les autres frames passent directement
      renderPong(state);
    }
  });
}


async function performCountdown(): Promise<void> {
  // Si on a déjà un état, on le stocke pour le flouter
  const backupState = lastState;
  const duration = 1000; // durée de chaque animation en ms

  for (const num of [3, 2, 1] as const) {
    await animateNumber(num, backupState, duration);
  }

  // courte pause après le "1"
  return new Promise(res => setTimeout(res, 200));
}

function animateNumber(
  num: number,
  bgState: MatchState | null,
  duration: number
): Promise<void> {
  return new Promise(resolve => {
    const start = performance.now();

    function frame(now: number) {
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
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}




export function joinQueue(username: string) {
  socket.emit('joinQueue', { username });
}

export function startSoloPong(username: string) {
  socket.emit('startSolo', { username });
}

// Envoi des commandes paddle au serveur
function sendMove(side: number, direction: 'up' | 'down' | null) {
  socket.emit('movePaddle', { side, direction });
}

// Écoute clavier global
window.addEventListener('keydown', (e) => {
  if (soloMode) {
    if (e.code === 'KeyD') sendMove(0, 'up');
    else if (e.code === 'KeyA') sendMove(0, 'down');
    else if (e.code === 'ArrowRight') sendMove(1, 'up');
    else if (e.code === 'ArrowLeft') sendMove(1, 'down');
  } else {
    if (e.code === 'KeyD' || e.code === 'KeyA') {
      const dir = e.code === 'KeyD' ? 'up' : 'down';
      sendMove(mySide, dir);
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (soloMode) {
    if (e.code === 'KeyD' || e.code === 'KeyA') sendMove(0, null);
    else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') sendMove(1, null);
  } else {
    if (e.code === 'KeyD' || e.code === 'KeyA') sendMove(mySide, null);
  }
});

// Initialise le canvas et le contexte
export function startPong() {
  canvas = document.querySelector('#pongCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  canvas.width = CW;
  canvas.height = CH;
}

// Ajout de la gestion du message de fin de partie
async function renderGameOverMessage(state: MatchState) {
  // Affiche le message uniquement en mode multi
  if (soloMode) return;

  const player = state.paddles[mySide];
  const message = player.lives > 0 ? 'You Win!' : 'Game Over';

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CW, CH);

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = '48px Arial';
  ctx.fillText(message, CX, CY);

  // Si le joueur a gagné, appeler l'API incrementWins
  if (player.lives > 0) {
    try {
      // Récupérer l'utilisateur actuel via GameManager
      const currentUser = await GameManager.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        console.error('Impossible de récupérer l\'utilisateur actuel.');
        return;
      }

      const response = await fetch('/api/games/incrementWins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Utilise les cookies pour l'authentification
        body: JSON.stringify({
          gameId: 1, // ID du jeu (Pong)
          userId: currentUser.id, // Utiliser l'ID utilisateur actuel
        }),
      });

      if (response.ok) {
        console.log('Victoire enregistrée avec succès.');
      } else {
        console.error('Erreur lors de l\'enregistrement de la victoire:', await response.json());
      }
    } catch (error) {
      console.error('Erreur réseau lors de l\'enregistrement de la victoire:', error);
    }
  }
}

// Dessine l'état de la partie Tri-Pong
export function renderPong(state: MatchState) {
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
  ctx.lineWidth   = 6;
  ctx.shadowBlur  = 20;
  ctx.shadowColor = 'rgba(0,174,255,0.5)';
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4) paddles avec glow pour le tien
  state.paddles.forEach((p, i) => {
    const start = p.phi - ARC_HALF;
    const end   = p.phi + ARC_HALF;
    const isMine = i === mySide;

    ctx.save();
    ctx.lineWidth   = P_TH;
    ctx.strokeStyle = isMine
      ? 'cyan'
      : (p.lives > 0 ? '#eee' : 'red');

    if (isMine) {
      ctx.shadowBlur  = 30;
      ctx.shadowColor = 'cyan';
    }

    ctx.beginPath();
    ctx.arc(CX, CY, R, start, end);
    ctx.stroke();
    ctx.restore();
  });

  // 5) balle avec ombre portée
  const bx = CX + state.ball.x;
  const by = CY + state.ball.y;
  ctx.save();
  ctx.fillStyle   = 'white';
  ctx.shadowBlur  = 15;
  ctx.shadowColor = 'white';
  ctx.beginPath();
  ctx.arc(bx, by, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  explosion.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = 'orange';
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
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    gameover = true;
    animateGameOver();
    ctx.restore();
    renderGameOverMessage(state);
  }
}


// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi: number, r: number) {
  return {
    x: CX + r * Math.cos(phi),
    y: CY + r * Math.sin(phi),
  };
}

// Dessine un cœur (pour les vies)
function drawHeart(x: number, y: number, sz: number, fill: boolean) {
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
socket.on('ballExplode', ({ x, y }: { x:number, y:number }) => {
  createExplosion(x, y);
});



document.addEventListener('DOMContentLoaded', () => {
  displayMenu();
});

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('optionnalModal');
  if (!modal) return;
  if (modal.innerHTML.trim() !== '') {
    modal.innerHTML = '';
    displayMenu();
  }
});