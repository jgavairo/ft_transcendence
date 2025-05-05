import { displayMenu } from './DisplayMenu.js';
import { socket } from './network.js';

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
let ctx: CanvasRenderingContext2D;

// Constantes de rendu (synchronisées avec le serveur)
const CW = 1200;
const CH = 770;
const CX = CW / 2;
const CY = CH / 2;
const R  = Math.min(CW, CH) / 2 - 45;      // rayon du terrain
const P_TH = 12;                           // épaisseur des paddles
const ARC_HALF = Math.PI / 18;      // demi-angle du paddle

// Initialise la connexion Socket.IO et les handlers
export function connectPong() {
  socket.on('matchFound', (data: {
    roomId: string;
    side: number;
    mode: 'solo' | 'multi';
  }) => {

    soloMode = (data.mode === 'solo');
    mySide   = soloMode ? 0 : data.side;
    roomId   = data.roomId;
    startPong();
  });

  socket.on('gameState', (state: MatchState) => {
    renderPong(state);
  });
}


export function joinQueue(username: string) {
  socket.emit('joinQueue', { username });
}

export function startSoloPong(username: string) {
  socket.emit('startSolo', { username });
}


// Envoi des commandes paddle au serveur
function sendMove(side: number, direction: 'up'|'down'|null) {
  socket.emit('movePaddle', { side, direction });
}

// Écoute clavier global
window.addEventListener('keydown', e => {
  if (soloMode) {
    if      (e.code === 'KeyD')      sendMove(0, 'up');
    else if (e.code === 'KeyA')      sendMove(0, 'down');
    else if (e.code === 'ArrowRight')   sendMove(1, 'up');
    else if (e.code === 'ArrowLeft') sendMove(1, 'down');
  } else {
    if (e.code === 'KeyD' || e.code === 'KeyA') {
      const dir = e.code === 'KeyD' ? 'up' : 'down';
      sendMove(mySide, dir);
    }
  }
});

window.addEventListener('keyup', e => {
  if (soloMode) {
    if      (e.code === 'KeyD' || e.code === 'KeyA')       sendMove(0, null);
    else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') sendMove(1, null);
  } else {
    if (e.code === 'KeyD' || e.code === 'KeyA') sendMove(mySide, null);
  }
});

// Initialise le canvas et le contexte
export function startPong() {
  canvas = document.querySelector('#pongCanvas') as HTMLCanvasElement;
  ctx    = canvas.getContext('2d')!;
  canvas.width  = CW;
  canvas.height = CH;
}

// Dessine l'état de la partie Tri-Pong
export function renderPong(state: MatchState) {
  // Efface
  ctx.clearRect(0, 0, CW, CH);

  // Dessine chaque paddle (arc)
  ctx.lineWidth = P_TH;
  state.paddles.forEach(p => {
    const start = p.phi - ARC_HALF;
    const end   = p.phi + ARC_HALF;
    ctx.strokeStyle = p.lives > 0 ? 'white' : 'red';
    ctx.beginPath();
    ctx.arc(CX, CY, R, start, end);
    ctx.stroke();
  });

  // Dessine la balle
  const bx = CX + state.ball.x;
  const by = CY + state.ball.y;
  const BALL_R = 8;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(bx, by, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  // Dessine les vies (cœurs) pour chaque paddle
  state.paddles.forEach(p => {
    const label = fromPolar(p.phi, R + 20);
    for (let i = 0; i < 3; i++) {
      drawHeart(label.x + (i - 1) * 20, label.y, 8, i < p.lives);
    }
  });

  // Optionnel : si gameOver, afficher message
  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '36px Arial';
    ctx.fillText('Game finish', CX, CY - 20);
  }
}

// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi: number, r: number) {
  return {
    x: CX + r * Math.cos(phi),
    y: CY + r * Math.sin(phi)
  };
}

// Dessine un cœur (pour les vies)
function drawHeart(x: number, y: number, sz: number, fill: boolean) {
  ctx.save();
  ctx.beginPath();
  const t = sz * 0.3;
  ctx.moveTo(x, y + t);
  ctx.bezierCurveTo(x, y, x - sz/2, y, x - sz/2, y + t);
  ctx.bezierCurveTo(
    x - sz/2, y + (sz + t) / 2,
    x,        y + (sz + t) / 2,
    x,        y + sz
  );
  ctx.bezierCurveTo(
    x,        y + (sz + t) / 2,
    x + sz/2, y + (sz + t) / 2,
    x + sz/2, y + t
  );
  ctx.bezierCurveTo(x + sz/2, y, x, y, x, y + t);
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