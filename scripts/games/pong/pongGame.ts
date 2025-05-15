import { displayMenu, PongMenuManager} from './menu/DisplayMenu.js';
import { socket } from './network.js';
import { renderRankings } from '../../pages/library/showGameDetails.js';
import { GameManager } from '../../managers/gameManager.js'; // Import de GameManager
import { createExplosion, explosion } from './ballExplosion.js';
import { renderPong } from './renderPong.js';
import { sendMove, sendMoveTri } from './SocketEmit.js'
import { fetchUsernames, renderFriendList } from '../../pages/library/showGameDetails.js'; // Ajout pour friend list
import { initPauseMenu, showPauseMenu, drawPauseMenu, onEscapeKey } from './pauseMenu.js';
import api from '../../helpers/api.js';
import { HOSTNAME } from '../../main.js';
import { drawTutorialSolo1, drawTutorialSolo2 } from './showTutorial.js';


// Interface de l'état de partie reçue du serveur
export interface MatchState {
  roomId: string;
  paddles: { id: string; phi: number; lives: number }[];
  ball: { x: number; y: number };
  gameOver: boolean;
}

// Variables réseau
export let mySide: number;
let roomId: string;
let soloMode = false;
let modePong = false;
let soloTri  = false;
let running = false;

// Canvas et contexte
export let canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

// Constantes de rendu (synchronisées avec le serveur)
const CW = 1200;
const CH = 800;


let ready = false;  // on ne dessine qu'une fois le countdown fini
let lastState: MatchState | null = null;
let firstFrame = false;

export let gameover = false;

export function setGameoverTrue()
{
  gameover = true;
}

// ID des joueurs
let user1Id: string | null = null; // ID du joueur 1
let user2Id: string | null = null; // ID du joueur 2


export let showTutorial1 = false;
export let showTutorial2 = false;


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

export let playerName: string = "";
export let opponentName: string = "";
export let playerNames: string[] = [];

export async function onMatchFound(data: any) {
  modePong  = true;
  soloTri   = false;
  soloMode  = data.mode === 'solo';
  mySide    = soloMode ? 0 : data.side;
  lastState = null;
  ready     = false;
  firstFrame= false;

  user1Id     = data.user1Id;
  user2Id     = data.user2Id;
  playerName  = data.you   || 'Player';
  opponentName= data.opponent || 'Opponent';
  const response = await api.post(`http://${HOSTNAME}:3000/api/games/isFirstGame`,
    {
      gameid: 1
    });
  const payload = await response.json();
  const isFirstGame1 = payload.firstGame;  
  if (isFirstGame1) {
    showTutorial1 = true;
    ready = false;
    const onStart = () => {
      showTutorial1 = false;
      ready = true;
      window.removeEventListener('keydown', onStart);
    };
    window.addEventListener('keydown', onStart);
    startPong();
  }
  else { 
    ready = true;
    startPong();
  }
}

export async function onTriMatchFound(data: any) {
  modePong  = false;
  soloTri   = data.mode === 'solo-tri';
  console.log('data mode =', data.mode);
  soloMode  = false;            // pas utilisé ici
  mySide    = soloTri ? 0 : data.side;
  lastState = null;
  ready     = true;
  firstFrame= false;

  // si tu veux stocker user1/user2 pour l'historique, fais-le ici aussi
  user1Id     = data.user1Id;
  user2Id     = data.user2Id;
  playerName  = data.you       || 'Player';
  opponentName= data.opponent  || 'Opponent';
  playerNames = Array.isArray(data.players) ? data.players : [];
  const response = await api.post(`http://${HOSTNAME}:3000/api/games/isFirstGame`,
    {
      gameid: 1
    });
  const payload = await response.json();
  const isFirstGame2 = payload.firstGame;
  if (isFirstGame2) {
    showTutorial2 = true;
    ready = false;
    const onStart = () => {
      showTutorial2 = false;
      ready = true;
      window.removeEventListener('keydown', onStart);
    };
    window.addEventListener('keydown', onStart);
    startPong();
  }
  else { 
    ready = true;
    startPong();
  }
}

function onGameState(state: MatchState) {
  if (!running){ 
    return;
  }
  if (showTutorial1 && modePong == true) {
    drawTutorialSolo1(canvas, ctx);
    return;
  }
  if (showTutorial2 && modePong == false) {
    drawTutorialSolo2(canvas, ctx);
    return;
  }

  lastState = state;
  if (!ready) return;

  if (showPauseMenu) {
    if (lastState) {
      renderPong(lastState);
    }
    drawPauseMenu(canvas, ctx);
    return;
  }

  if (!firstFrame) {
    firstFrame = true;
    // displayParticles();
    setTimeout(() => renderPong(state), 500);
  } else {
    renderPong(state);
  }
}

let loopId: number | null = null;

export function stopGame() {
  // 1) Arrêter la boucle requestAnimationFrame
  console.log('stopGame called');
  running = false;                    // ← désactive le rendu
  if (loopId !== null) {
    cancelAnimationFrame(loopId);
    loopId = null;
  }
  socket.disconnect();
  
  window.removeEventListener('keydown', onEscapeKey);
  // 2) Débrancher les écouteurs clavier
  // window.removeEventListener('keydown', onKeyDown);
  // window.removeEventListener('keyup',   onKeyUp);

  // 4) Mettre à l’arrêt le module de particules/explosions
  explosion.length = 0;

  // 5) Nettoyer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 6) Autres nettoyages
  resetGame();
}

export function connectPong(isOnline: boolean) {
  // Pong classique
  socket.connect();
  if (isOnline) 
  {
    socket.off('matchFound').on('matchFound', PongMenuManager.matchFound2Players);
    socket.off('gameState').on('gameState', onGameState);
    
    // Tri-Pong → on branche exactement les mêmes handlers
    socket.off('matchFoundTri').on('matchFoundTri', PongMenuManager.matchFound3Players);
    socket.off('stateUpdateTri').on('stateUpdateTri', onGameState);
  }
  else
  {
    socket.off('matchFound').on('matchFound', onMatchFound);
    socket.off('gameState').on('gameState', onGameState);

    socket.off('matchFoundTri').on('matchFoundTri', onTriMatchFound);
    socket.off('stateUpdateTri').on('stateUpdateTri', onGameState);
  }

  // Explosion de balle
  socket.off('ballExplode').on('ballExplode', ({ x, y }) => {
    createExplosion(x, y);
  });

  // Rafraîchir le classement et la friend list à la fin d'une partie de Pong
  socket.on('pongGameEnded', async ({ gameId }) => {
    const rankingsContainer = document.querySelector('#rankings-container') as HTMLElement;
    if (rankingsContainer && rankingsContainer.offsetParent !== null) {
      const currentUser = await GameManager.getCurrentUser();
      await renderRankings(gameId, rankingsContainer, currentUser);
    }
    // Actualiser la friend list si elle est présente
    const details = document.querySelector('.library-details') as HTMLElement;
    if (details) {
      const people = await fetchUsernames();
      // --- Filtrage comme dans showGameDetails.ts ---
      let friendIds: number[] = [];
      try {
        const res = await fetch('/api/friends/allFriendIds');
        const data = await res.json();
        if (data.success && Array.isArray(data.ids)) {
          friendIds = data.ids;
        }
      } catch (e) {
        friendIds = [];
      }
      let currentUserObj = await GameManager.getCurrentUser();
      // Pour Pong, on ne connaît pas les userIds des possesseurs du jeu ici, donc on affiche tous les amis sauf soi-même
      const filteredPeople = people.filter(person => person.id !== currentUserObj.id && friendIds.includes(person.id));
      const friendsSection = details.querySelector('.friendsSection');
      if (friendsSection) {
        friendsSection.outerHTML = renderFriendList(filteredPeople);
        // Réattacher les listeners sur les nouveaux éléments friendName
        const newFriendsSection = details.querySelector('.friendsSection');
        if (newFriendsSection) {
          const friendNames = newFriendsSection.querySelectorAll('.friendName') as NodeListOf<HTMLSpanElement>;
          friendNames.forEach(friendName => {
            friendName.addEventListener('click', () => {
              const username = friendName.getAttribute('data-username')!;
              const profilePicture = friendName.getAttribute('data-profile-picture') || 'default-profile.png';
              const email = friendName.getAttribute('data-email')!;
              const bio = friendName.getAttribute('data-bio') || 'No bio available';
              // On ne peut pas récupérer userId ici sans accès à people, donc on le cherche à nouveau
              const userId = people.find((person: { id: number, username: string }) => person.username === username)?.id || 0;
              // showProfileCard est importé indirectement via showGameDetails
              import('../../pages/community/peopleList.js').then(mod => {
                mod.showProfileCard(username, profilePicture, email, bio, userId);
              });
            });
          });
        }
      }
    }
  });
}

// En haut du fichier
function onKeyDown(e: KeyboardEvent) {
  if (!ready || gameover) return;

  // --- PONG CLASSIQUE ---
  if (modePong) {
    if (soloMode) {
      // 2 paddles joués localement : 0→A/D, 1→←/→
      if (e.code === 'KeyD')      sendMove(0, 'up');
      else if (e.code === 'KeyA') sendMove(0, 'down');
      else if (e.code === 'ArrowRight') sendMove(1, 'up');
      else if (e.code === 'ArrowLeft')  sendMove(1, 'down');
    } else {
      // multi : chacun pilote SON side
      if (mySide === 0) {
        if (e.code === 'KeyD')      sendMove(0, 'up');
        else if (e.code === 'KeyA') sendMove(0, 'down');
      } else {
        if (e.code === 'KeyD') sendMove(1, 'up');
        else if (e.code === 'KeyA')  sendMove(1, 'down');
      }
    }
    return;
  }

  // --- TRI-PONG ---

  if (!soloTri) {
    // multi-Tri : chaque client ne pilote que SON side EN A/D
    if (e.code === 'KeyD') sendMoveTri(mySide, 'up');
    else if (e.code === 'KeyA') sendMoveTri(mySide, 'down');
    return;
  }

  // solo-Tri : pilotage de 3 pads avec A/D, J/L, Fleches
  const codes = ['KeyA','KeyD','KeyJ','KeyL','ArrowLeft','ArrowRight'];
  if (!codes.includes(e.code)) return;

  let side = ['KeyA','KeyD'].includes(e.code) ? 0
           : ['KeyJ','KeyL'].includes(e.code) ? 1
           : 2;
  const dir = ['KeyD','KeyL','ArrowRight'].includes(e.code) ? 'up' : 'down';
  sendMoveTri(side, dir);
}


function onKeyUp(e: KeyboardEvent) {
  if (!ready || gameover) return;

  // --- PONG CLASSIQUE ---
  if (modePong) {
    if (soloMode) {
      if (['KeyD','KeyA'].includes(e.code))      sendMove(0, null);
      else if (['ArrowRight','ArrowLeft'].includes(e.code)) sendMove(1, null);
    } else {
      if (e.code === 'KeyD' || e.code === 'KeyA') sendMove(mySide, null);
    }
    return;
  }

  // ── TRI-PONG ──
  if (!soloTri) {
    // multi-Tri : arrête SON side en A/D
    if (e.code === 'KeyD' || e.code === 'KeyA') sendMoveTri(mySide, null);
    return;
  }

  // solo-Tri : arrêts avec les mêmes touches
  const codes = ['KeyA','KeyD','KeyJ','KeyL','ArrowLeft','ArrowRight'];
  if (!codes.includes(e.code)) return;

  let side = ['KeyA','KeyD'].includes(e.code) ? 0
           : ['KeyJ','KeyL'].includes(e.code) ? 1
           : 2;
  sendMoveTri(side, null);
}

// Initialise le canvas et le contexte
export function startPong() {
  const modal = document.getElementById('games-modal');
  if (modal)
    modal.innerHTML = '<canvas id="gameCanvas" style="width: 1200px; height: 800px;"></canvas>';
  running = true;
  canvas = document.querySelector('#gameCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  canvas.width = CW;
  canvas.height = CH;
  initPauseMenu(canvas, ctx, displayMenu);
}


// Ajout de la gestion du message de fin de partie
export async function renderGameOverMessage(state: MatchState) {
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
    if (player.lives > 0 && modePong && !soloMode && !soloTri) {
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
    } else if (player.lives <= 0 && modePong && !soloMode && !soloTri) {
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