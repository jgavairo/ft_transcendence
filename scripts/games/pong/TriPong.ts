import { io, Socket } from 'socket.io-client';

// Interface de l'état de partie reçue du serveur
export interface TriMatchState {
  roomId: string;
  paddles: { phi: number; lives: number }[];
  ball: { x: number; y: number };
  gameOver: boolean;
}

// Variables réseau
let socket: Socket;
let mySide: number;
let roomId: string;

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
export function connectTriPong() {
  socket = io('/game');

  socket.on('matchFoundTri', (data: { roomId: string; side: number }) => {
    roomId = data.roomId;
    mySide = data.side;
    startTriPong();
  });

  socket.on('stateUpdateTri', (state: TriMatchState) => {
    renderTriPong(state);
  });
}


export function joinTriQueue(username: string) {
  socket.emit('joinTriQueue', { username });
}

export function startSoloTriPong(username: string) {
  socket.emit('startSoloTri', { username });
}


// Envoi des commandes paddle au serveur
function sendMove(side: number, direction: 'up'|'down'|null) {
  socket.emit('movePaddleTri', { side, direction });
}

// Écoute clavier global
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (mySide >= 0) {
    // —— mode multi-tri : votre player (mySide) se déplace avec W/S seulement
    if (e.code === 'KeyW') {
      sendMove(mySide, 'up');
    } else if (e.code === 'KeyS') {
      sendMove(mySide, 'down');
    }
  } else {
    // —— mode solo-tri : un seul joueur pilote tout, on garde W/S, I/K, flèches
    if (['KeyW','KeyS','KeyI','KeyK','ArrowUp','ArrowDown'].includes(e.code)) {
      let side: number;
      if (['KeyW','KeyS'].includes(e.code))          side = 0;
      else if (['KeyI','KeyK'].includes(e.code))     side = 1;
      else /* arrows */                              side = 2;
      const dir = (e.code === 'KeyW' || e.code === 'KeyI' || e.code === 'ArrowUp') 
                  ? 'up' : 'down';
      sendMove(side, dir);
    }
  }
});

window.addEventListener('keyup', (e: KeyboardEvent) => {
  if (mySide >= 0) {
    // —— multi-tri : on arrête toujours avec W/S
    if (e.code === 'KeyW' || e.code === 'KeyS') {
      sendMove(mySide, null);
    }
  } else {
    // —— solo-tri : on arrête le paddle correspondant
    if (['KeyW','KeyS','KeyI','KeyK','ArrowUp','ArrowDown'].includes(e.code)) {
      let side: number;
      if (['KeyW','KeyS'].includes(e.code))          side = 0;
      else if (['KeyI','KeyK'].includes(e.code))     side = 1;
      else /* arrows */                              side = 2;
      sendMove(side, null);
    }
  }
});

// Initialise le canvas et le contexte
export function startTriPong() {
  canvas = document.querySelector('#pongCanvas') as HTMLCanvasElement;
  ctx    = canvas.getContext('2d')!;
  canvas.width  = CW;
  canvas.height = CH;
}

// Dessine l'état de la partie Tri-Pong
export function renderTriPong(state: TriMatchState) {
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
