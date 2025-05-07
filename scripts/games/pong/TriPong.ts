import { socket } from './network.js';
import { createExplosion } from './ballExplosion.js';

// Interface de l'état de partie reçue du serveur
export interface TriMatchState {
  roomId: string;
  paddles: { phi: number; lives: number }[];
  ball: { x: number; y: number };
  gameOver: boolean;
}

// Variables réseau
let mySide: number = -1;
let roomId: string;

// Canvas et contexte
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

// Constantes de rendu (synchronisées avec le serveur)
const CW = 1185;
const CH = 785;
const CX = CW / 2;
const CY = CH / 2;
const R  = Math.min(CW, CH) / 2 - 45;      // rayon du terrain
const P_TH = 12;                           // épaisseur des paddles
const ARC_HALF = Math.PI / 18;             // demi-angle du paddle

let readyTri    = false;
let firstFrameTri = false;
let lastTriState: TriMatchState | null = null;

// Initialise la connexion Socket.IO et les handlers
export function connectTriPong() {
  socket.on('matchFoundTri', (data: { roomId: string; side: number }) => {
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

  socket.on('stateUpdateTri', (state: TriMatchState) => {
    lastTriState = state;

    // on n'affiche jamais avant que ready soit true
    if (!readyTri) return;

    // si c'est la toute première frame, on la met en attente 500 ms
    if (!firstFrameTri) {
      firstFrameTri = true;
      setTimeout(() => {
        renderTriPong(state);
      }, 500);
    } else {
      // toutes les autres frames passent directement
      renderTriPong(state);
    }
  });
}


async function performCountdown(): Promise<void> {
  // Si on a déjà un état, on le stocke pour le flouter
  const backupState = lastTriState;
  const duration = 1000; // durée de chaque animation en ms

  for (const num of [3, 2, 1] as const) {
    await animateNumber(num, backupState, duration);
  }

  // courte pause après le "1"
  return new Promise(res => setTimeout(res, 200));
}

function animateNumber(
  num: number,
  bgState: TriMatchState | null,
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
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
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
    if (e.code === 'KeyD') {
      sendMove(mySide, 'up');
    } else if (e.code === 'KeyA') {
      sendMove(mySide, 'down');
    }
  } else {
    // —— mode solo-tri : un seul joueur pilote tout, on garde W/S, I/K, flèches
    if (['KeyD','KeyA','KeyL','KeyJ','ArrowRight','ArrowLeft'].includes(e.code)) {
      let side: number;
      if (['KeyA','KeyD'].includes(e.code))          side = 0;
      else if (['KeyJ','KeyL'].includes(e.code))     side = 1;
      else /* arrows */                              side = 2;
      const dir = (e.code === 'KeyD' || e.code === 'KeyL' || e.code === 'ArrowRight') 
                  ? 'up' : 'down';
      sendMove(side, dir);
    }
  }
});

window.addEventListener('keyup', (e: KeyboardEvent) => {
  if (mySide >= 0) {
    // —— multi-tri : on arrête toujours avec W/S
    if (e.code === 'KeyD' || e.code === 'KeyA') {
      sendMove(mySide, null);
    }
  } else {
    // —— solo-tri : on arrête le paddle correspondant
    if (['KeyD','KeyA','KeyL','KeyJ','ArrowRight','ArrowLeft'].includes(e.code)) {
      let side: number;
      if (['KeyD','KeyA'].includes(e.code))          side = 0;
      else if (['KeyL','KeyJ'].includes(e.code))     side = 1;
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

export function renderTriPong(state: TriMatchState) {
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
  ctx.lineWidth   = 6;
  ctx.shadowBlur  = 20;
  ctx.shadowColor = 'rgba(0,174,255,0.5)';
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4) draw the three paddles, with a glow on yours - Style amélioré
  state.paddles.forEach((p, i) => {
    const start = p.phi - ARC_HALF;
    const end   = p.phi + ARC_HALF;
    const isMine = (i === mySide);

    ctx.save();
    
    // Augmentation de l'épaisseur des raquettes pour meilleure visibilité
    ctx.lineWidth = P_TH + 2;
    
    // Création d'un dégradé pour les raquettes
    const gradient = ctx.createLinearGradient(
      CX + (R - 20) * Math.cos(p.phi), 
      CY + (R - 20) * Math.sin(p.phi),
      CX + (R + 20) * Math.cos(p.phi), 
      CY + (R + 20) * Math.sin(p.phi)
    );
    
    if (isMine) {
      // Dégradé bleu-cyan pour ma raquette
      gradient.addColorStop(0, '#00BFFF'); // DeepSkyBlue
      gradient.addColorStop(0.5, '#00FFFF'); // Cyan
      gradient.addColorStop(1, '#00BFFF'); // DeepSkyBlue
      
      // Effet de lueur plus doux et plus large
      ctx.shadowBlur = 35;
      ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    } else if (p.lives > 0) {
      // Dégradé blanc-gris pour les raquettes adverses
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.5, '#F0F0F0');
      gradient.addColorStop(1, '#CCCCCC');
      
      // Légère lueur pour les raquettes adverses
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    } else {
      // Dégradé rouge pour une raquette sans vie
      gradient.addColorStop(0, '#FF0000');
      gradient.addColorStop(0.5, '#FF4444');
      gradient.addColorStop(1, '#FF0000');
      
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
    }
    
    ctx.strokeStyle = gradient;
    
    // Ajouter des extrémités arrondies aux raquettes
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(CX, CY, R, start, end);
    ctx.stroke();
    ctx.restore();
  });

  // 5) ball with soft glow
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


  // 6) static hearts for lives et ajout des noms des joueurs - Style amélioré
  state.paddles.forEach((p, i) => {
    const isMine = i === mySide;
    const baseRadius = R + 30; // Augmenté légèrement pour plus d'espace
    const phi = p.phi;
    
    // Position de base pour le bloc d'informations
    const basePos = fromPolar(phi, baseRadius);
    
    // Assurons-nous que le bloc reste à l'intérieur de la fenêtre
    const margin = 30;
    const blockX = Math.max(margin, Math.min(CW - margin, basePos.x));
    const blockY = Math.max(margin, Math.min(CH - margin, basePos.y));
    
    // Créer un nom pour chaque raquette
    const name = isMine ? "Player" : "P" + (i+1);
    
    ctx.save();
    
    // Police améliorée pour meilleure lisibilité
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    
    const textWidth = ctx.measureText(name).width;
    const blockWidth = Math.max(textWidth, 3 * 25) + 20; // Légèrement plus large
    const blockHeight = 55; // Légèrement plus haut
    
    // Fond semi-transparent avec coins arrondis
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    roundRect(
      ctx,
      blockX - blockWidth/2, 
      blockY - blockHeight/2, 
      blockWidth, 
      blockHeight,
      8 // Rayon des coins arrondis
    );
    
    // Dessiner le nom avec ombre portée pour meilleure lisibilité
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    
    // Dégradé pour le texte du nom
    if (isMine) {
      const textGradient = ctx.createLinearGradient(
        blockX - textWidth/2, blockY - 15,
        blockX + textWidth/2, blockY - 15
      );
      textGradient.addColorStop(0, '#FFD700'); // Or
      textGradient.addColorStop(0.5, '#FFF380'); // Or plus clair
      textGradient.addColorStop(1, '#FFD700'); // Or
      ctx.fillStyle = textGradient;
    } else {
      const textGradient = ctx.createLinearGradient(
        blockX - textWidth/2, blockY - 15,
        blockX + textWidth/2, blockY - 15
      );
      textGradient.addColorStop(0, '#FF69B4'); // Rose vif
      textGradient.addColorStop(0.5, '#FFB6C1'); // Rose clair
      textGradient.addColorStop(1, '#FF69B4'); // Rose vif
      ctx.fillStyle = textGradient;
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, blockX, blockY - 15);
    
    // Réinitialiser l'ombre pour les cœurs
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    
    // Dessiner les cœurs sous le nom - Plus grands et mieux espacés
    for (let h = 0; h < 3; h++) {
      drawHeart(blockX + (h - 1) * 26, blockY + 10, 13, h < p.lives);
    }
    
    ctx.restore();
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


interface Particle { x:number; y:number; vx:number; vy:number; alpha:number }
let explosion: Particle[] = [];

// Listen for server burst
socket.on('ballExplode', ({ x, y }: { x:number, y:number }) => {
  createExplosion(x, y);
});

// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi: number, r: number) {
  return {
    x: CX + r * Math.cos(phi),
    y: CY + r * Math.sin(phi)
  };
}

// Ajout d'une fonction pour dessiner des rectangles arrondis
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
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
  
  if (fill) {
    // Créer un dégradé pour le cœur rempli
    const heartGradient = ctx.createRadialGradient(
      x, y + sz/2, sz * 0.2,
      x, y + sz/2, sz * 1.2
    );
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
