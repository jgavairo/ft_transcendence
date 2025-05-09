import { displayMenu } from './DisplayMenu.js';
import { socket } from './network.js';
import { GameManager } from '../../managers/gameManager.js'; // Import de GameManager
import { createExplosion, explosion, animateGameOver } from './ballExplosion.js';
import { showGameOverOverlay } from './DisplayFinishGame.js';
import { sendMove } from './SocketEmit.js'

// Interface de l'état de partie reçue du serveur
export interface MatchState {
  roomId: string;
  paddles: { id: string; phi: number; lives: number }[];
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
const CW = 1200;
const CH = 800;
const CX = CW / 2;
const CY = CH / 2;
const R  = Math.min(CW, CH) / 2 - 45;      // rayon du terrain
const P_TH = 12;                           // épaisseur des paddles
const ARC_HALF = Math.PI / 18;      // demi-angle du paddle

let ready = false;  // on ne dessine qu'une fois le countdown fini
let lastState: MatchState | null = null;
let firstFrame = false;

export let gameover = false;
// ID des joueurs
let user1Id: string | null = null; // ID du joueur 1
let user2Id: string | null = null; // ID du joueur 2

// Noms des joueurs
let playerName: string = ""; // Nom du joueur local
let opponentName: string = ""; // Nom de l'adversaire

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup',   onKeyUp);

// Fonction pour récupérer l'ID utilisateur à partir d'un socket_id
export function getUserIdFromSocketId(socketId: string): Promise<string | null> {
  return new Promise((resolve) => {
    socket.emit('getUserIdFromSocketId', { socketId }, (userId: string | null) => {
      resolve(userId);
    });
  });
}

// Fonction pour récupérer le user1Id
export function getUser1Id(): string | null {
  return user1Id;
}

// Fonction pour récupérer le user2Id
export function getUser2Id(): string | null {
  return user2Id;
}

console.log('pongGame.ts chargé, prête à connectPong');

function onMatchFound(data: any) {
  console.log('📥 onMatchFound', data);
  soloMode   = data.mode === 'solo';
  mySide     = soloMode ? 0 : data.side;
  lastState  = null;
  ready      = false;
  firstFrame = false;

  user1Id    = data.user1Id;
  user2Id    = data.user2Id;
  playerName = data.you || 'Player';
  opponentName = data.opponent || 'Opponent';

  startPong();
  performCountdown().then(() => { ready = true; });
}

function onGameState(state: MatchState) {
  console.log('📦 full state:', state);
  console.log('🎮 paddles raw:', state.paddles);
  console.log('🎮 paddles entries:', state.paddles.map((p,i) => [i, p]));
  lastState = state;
  if (!ready) return;
  if (!firstFrame) {
    firstFrame = true;
    setTimeout(() => renderPong(state), 500);
  } else {
    renderPong(state);
  }
}


export function connectPong() {
  console.log('ℹ️ connectPong() appelé');
  // Pong classique
  socket.off('matchFound').on('matchFound', onMatchFound);
  socket.off('gameState'  ).on('gameState',   onGameState);

  // Tri-Pong → on branche exactement les mêmes handlers
  socket.off('matchFoundTri').on('matchFoundTri', onMatchFound);
  socket.off('stateUpdateTri').on('stateUpdateTri', onGameState);

  // Explosion de balle
  socket.off('ballExplode').on('ballExplode', ({ x, y }) => {
    createExplosion(x, y);
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


// En haut du fichier
function onKeyDown(e: KeyboardEvent) {
  if (!ready || gameover) return;
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
}

function onKeyUp(e: KeyboardEvent) {
  if (!ready || gameover) return;
  if (soloMode) {
    if (e.code === 'KeyD' || e.code === 'KeyA') sendMove(0, null);
    else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') sendMove(1, null);
  } else {
    if (e.code === 'KeyD' || e.code === 'KeyA') sendMove(mySide, null);
  }
}

// Initialise le canvas et le contexte
export function startPong() {
  canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  canvas.width = CW;
  canvas.height = CH;
}


// Ajout de la gestion du message de fin de partie
async function renderGameOverMessage(state: MatchState) {
  // Affiche le message uniquement en mode multi
  if (soloMode) return;

  const player = state.paddles[mySide];
  const opponent = state.paddles.find((_, index) => index !== mySide);

  if (!opponent) {
    console.error('Impossible de récupérer les informations de l\'adversaire.');
    return;
  }

  try {
    // Récupérer l'utilisateur actuel via GameManager
    const currentUser = await GameManager.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('Impossible de récupérer l\'utilisateur actuel.');
      return;
    }

    // Appeler l'API en fonction du résultat
    if (player.lives > 0) {
      // Victoire : appeler incrementWins
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
    } else {
      // Défaite : appeler incrementLosses
      const response = await fetch('/api/games/incrementLosses', {
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
        console.log('Défaite enregistrée avec succès.');
      } else {
        console.error('Erreur lors de l\'enregistrement de la défaite:', await response.json());
      }
    }

    // Ajouter le match à l'historique (seulement en mode multijoueur)
    if (!soloMode) {
      try {
        // Récupérer les IDs d'utilisateur à partir des joueurs connectés
        // Cette partie est critique pour résoudre le problème des socket_id vs user_id
        
        // 1. Utiliser l'ID de l'utilisateur courant (qui est toujours fiable)
        const myUserId = currentUser.id;
        
        // 2. Essayer de récupérer l'ID du deuxième joueur
        let opponentUserId = null;
        
        // Fonction utilitaire pour vérifier si un ID ressemble à un socket_id
        const isSocketId = (id: string | null): boolean => {
          if (!id) return true;
          return typeof id === 'string' && (
            id.includes('_') || 
            id.includes('-') || 
            id.length > 10 ||
            isNaN(Number(id))
          );
        };
        
        // Chercher l'ID stocké dans les variables user1Id/user2Id selon qui est l'adversaire
        if (mySide === 0 && user2Id && !isSocketId(user2Id)) {
          opponentUserId = user2Id;
        } else if (mySide === 1 && user1Id && !isSocketId(user1Id)) {
          opponentUserId = user1Id;
        }
        
        // Si aucun ID valide trouvé, essayer de récupérer via le socket_id
        if (!opponentUserId || isSocketId(opponentUserId)) {
          const opponentSocketId = state.paddles[mySide === 0 ? 1 : 0].id;
          try {
            opponentUserId = await getUserIdFromSocketId(opponentSocketId);
            console.log('ID récupéré pour l\'adversaire via socket:', opponentUserId);
          } catch (error) {
            console.error('Erreur lors de la récupération de l\'ID via socket:', error);
          }
        }
        
        // Si toujours aucun ID valide, ne pas envoyer l'historique
        if (!opponentUserId || isSocketId(opponentUserId)) {
          console.error('Impossible d\'obtenir un ID utilisateur valide pour l\'adversaire');
          return;
        }
        
        // Déterminer qui est user1 et user2 selon le côté du joueur
        let finalUser1Id, finalUser2Id, user1Lives, user2Lives;
        
        if (mySide === 0) {
          finalUser1Id = myUserId;
          finalUser2Id = opponentUserId;
          user1Lives = player.lives;
          user2Lives = opponent.lives;
        } else {
          finalUser1Id = opponentUserId;
          finalUser2Id = myUserId;
          user1Lives = opponent.lives;
          user2Lives = player.lives;
        }
        
        console.log('Ajout du match à l\'historique:', {
          user1Id: finalUser1Id, 
          user2Id: finalUser2Id, 
          user1Lives, 
          user2Lives
        });
        
        const historyResponse = await fetch('/api/match/addToHistory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            user1Id: finalUser1Id,
            user2Id: finalUser2Id,
            user1Lives,
            user2Lives,
          }),
        });
        
        if (historyResponse.ok) {
          console.log('Match ajouté à l\'historique avec succès.');
        } else {
          const errorData = await historyResponse.json();
          console.error('Erreur lors de l\'ajout du match à l\'historique:', errorData);
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout du match à l\'historique:', error);
      }
    }
  } catch (error) {
    console.error('Erreur réseau lors de l\'enregistrement du résultat:', error);
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

  // 4) paddles avec glow pour le tien - Style amélioré avec effet de dégradé
  state.paddles.forEach((p, i) => {
    const phi = (typeof p.phi === 'number' ? p.phi : (p as any).angle);
    const start = phi - ARC_HALF;
    const end   = phi + ARC_HALF;
    const isMine = i === mySide;

    ctx.save();
    ctx.lineWidth   = P_TH;
    ctx.strokeStyle = isMine
      ? 'cyan'
      : 'rgb(255, 0, 200)';
      // : (p.lives > 0 ? '#eee' : 'red');

    ctx.shadowBlur  = isMine ? 30 : 20;
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

  // 6) vies (cœurs) et noms combinés dans un seul bloc - Style amélioré
  state.paddles.forEach((p, i) => {
    const isMine = i === mySide;
    const baseRadius = R + 30; // Augmenté légèrement pour plus d'espace
    const phi = typeof p.phi === 'number' ? p.phi : (p as any).angle;
    
    // Position de base pour le bloc d'informations
    const basePos = fromPolar(phi, baseRadius);
    
    // Assurons-nous que le bloc reste à l'intérieur de la fenêtre
    const margin = 30;
    const blockX = Math.max(margin, Math.min(CW - margin, basePos.x));
    const blockY = Math.max(margin, Math.min(CH - margin, basePos.y));
    
    // Dessiner le fond du bloc - Ajout d'un fond subtil avec coins arrondis
    const name = isMine ? playerName : opponentName;
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
        blockX - textWidth/2, blockY - 12,
        blockX + textWidth/2, blockY - 12
      );
      textGradient.addColorStop(0, '#FFD700'); // Or
      textGradient.addColorStop(0.5, '#FFF380'); // Or plus clair
      textGradient.addColorStop(1, '#FFD700'); // Or
      ctx.fillStyle = textGradient;
    } else {
      const textGradient = ctx.createLinearGradient(
        blockX - textWidth/2, blockY - 12,
        blockX + textWidth/2, blockY - 12
      );
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
  });

  // 7) overlay game over
  if (state.gameOver) {
    gameover = true;
    animateGameOver();
    renderGameOverMessage(state);
    setTimeout(() => {
      showGameOverOverlay();
    }, 1500);
  
    return;
  }
}


// Convertit coordonnées polaires (phi,r) → cartésiennes
function fromPolar(phi: number, r: number) {
  return {
    x: CX + r * Math.cos(phi),
    y: CY + r * Math.sin(phi),
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
  ctx.bezierCurveTo(x, y, x - sz / 2, y, x - sz / 2, y + t);
  ctx.bezierCurveTo(x - sz / 2, y + (sz + t) / 2, x, y + (sz + t) / 2, x, y + sz);
  ctx.bezierCurveTo(x, y + (sz + t) / 2, x + sz / 2, y + (sz + t) / 2, x + sz / 2, y + t);
  ctx.bezierCurveTo(x + sz / 2, y, x, y, x, y + t);
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

// Listen for server burst
socket.on('ballExplode', ({ x, y }: { x:number, y:number }) => {
  createExplosion(x, y);
});

export function resetGame()
{
  ready      = false;
  gameover   = false;
  firstFrame = false;
  lastState  = null;
  explosion.length = 0;
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
      return;
    }
    resetGame();
    socket.removeAllListeners();
    socket.disconnect();
    socket.connect();
    connectPong();
});
