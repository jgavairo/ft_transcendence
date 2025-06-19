import { displayMenu, PongMenuManager } from './menu/DisplayMenu.js';
import { socket } from './network.js';
import { renderRankings } from '../../pages/library/showGameDetails.js';
import { GameManager } from '../../managers/gameManager.js'; // Import de GameManager
import { renderPong } from './renderPong.js';
import { sendMove, sendMoveTri } from './SocketEmit.js';
import { fetchUsernames, renderFriendList } from '../../pages/library/showGameDetails.js'; // Ajout pour friend list
import { initPauseMenu, showPauseMenu, drawPauseMenu, onEscapeKey } from './pauseMenu.js';
import { showErrorNotification } from '../../helpers/notifications.js';
import { MainApp } from '../../main.js'; // Import de MainApp pour getCurrentUser
// Network variables
export let mySide;
let roomId;
let soloMode = false;
let modePong = false;
let soloTri = false;
let running = false;
// Canvas and context
export let canvas = document.getElementById('gameCanvas');
export let ctx;
// Rendering constants (synchronized with server)
const CW = 1200;
const CH = 800;
let ready = false; // on ne dessine qu'une fois le countdown fini
let lastState = null;
let firstFrame = false;
export let gameover = false;
export function setGameoverTrue() {
    gameover = true;
}
// ID des joueurs
let user1Id = null; // ID du joueur 1
let user2Id = null; // ID du joueur 2
export let showTutorial = false;
export function setShowTutoFalse() {
    showTutorial = false;
}
// Variable pour indiquer si on est en private lobby
export let isPrivateLobby = false;
// Fonction pour activer le mode private lobby
export function setPrivateLobbyTrue() {
    isPrivateLobby = true;
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
// Function to get user ID from socket_id
export function getUserIdFromSocketId(socketId) {
    return new Promise((resolve) => {
        socket.emit('getUserIdFromSocketId', { socketId }, (userId) => {
            resolve(userId);
        });
    });
}
// Function to get user1Id
export function getUser1Id() {
    return user1Id;
}
// Function to get user2Id
export function getUser2Id() {
    return user2Id;
}
export let playerName = "";
export let opponentName = "";
export let playerNames = [];
export async function onMatchFound(data) {
    modePong = true;
    soloTri = false;
    soloMode = data.mode === 'solo';
    roomId = data.roomId || '';
    mySide = soloMode ? 0 : data.side;
    lastState = null;
    ready = false;
    firstFrame = false;
    user1Id = data.user1Id;
    user2Id = data.user2Id;
    playerName = data.you || 'Player';
    opponentName = data.opponent || 'Opponent';
    startPong();
    ready = true;
}
export async function onTriMatchFound(data) {
    modePong = false;
    soloTri = data.mode === 'solo-tri';
    console.log('data mode =', data.mode);
    soloMode = false; // pas utilisé ici
    mySide = soloTri ? 0 : data.side;
    lastState = null;
    ready = true;
    firstFrame = false;
    // si tu veux stocker user1/user2 pour l'historique, fais-le ici aussi
    user1Id = data.user1Id;
    user2Id = data.user2Id;
    playerName = data.you || 'Player';
    opponentName = data.opponent || 'Opponent';
    playerNames = Array.isArray(data.players) ? data.players : [];
    ready = true;
    startPong();
}
function onGameState(state) {
    if (!running) {
        return;
    }
    lastState = state;
    if (!ready)
        return;
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
    }
    else {
        renderPong(state);
    }
}
let loopId = null;
export function stopGame() {
    // 1) Stop the requestAnimationFrame loop
    console.log('stopGame called');
    isPrivateLobby = false;
    running = false; // ← disables rendering
    if (loopId !== null) {
        cancelAnimationFrame(loopId);
        loopId = null;
    }
    socket.disconnect();
    window.removeEventListener('keydown', onEscapeKey);
    // 2) Unbind keyboard listeners
    // window.removeEventListener('keydown', onKeyDown);
    // window.removeEventListener('keyup',   onKeyUp);
    // 5) Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 6) Other cleanup
    resetGame();
}
export function connectPong(isOnline) {
    // Pong classique
    socket.connect();
    if (isOnline) {
        socket.off('matchFound').on('matchFound', PongMenuManager.matchFound2Players);
        socket.off('gameState').on('gameState', onGameState);
        // Tri-Pong → we connect exactly the same handlers
        socket.off('matchFoundTri').on('matchFoundTri', PongMenuManager.matchFound3Players);
        socket.off('stateUpdateTri').on('stateUpdateTri', onGameState);
    }
    else {
        socket.off('matchFound').on('matchFound', onMatchFound);
        socket.off('gameState').on('gameState', onGameState);
        socket.off('matchFoundTri').on('matchFoundTri', onTriMatchFound);
        socket.off('stateUpdateTri').on('stateUpdateTri', onGameState);
    }
    // Refresh rankings and friend list at the end of a Pong game
    socket.on('pongGameEnded', async ({ gameId }) => {
        const isLogged = await MainApp.checkAuth();
        console.log('is logged:', isLogged);
        if (!isLogged.success) {
            console.warn('User is not logged in, skipping rankings refresh.');
            return;
        }
        const rankingsContainer = document.querySelector('#rankings-container');
        if (rankingsContainer && rankingsContainer.offsetParent !== null) {
            const currentUser = await GameManager.getCurrentUser();
            await renderRankings(gameId, rankingsContainer, currentUser);
        }
        // Update friend list if present
        const details = document.querySelector('.library-details');
        if (details) {
            const people = await fetchUsernames();
            // --- Filtering as in showGameDetails.ts ---
            let friendIds = [];
            try {
                const res = await fetch('/api/friends/allFriendIds');
                const data = await res.json();
                if (data.success && Array.isArray(data.ids)) {
                    friendIds = data.ids;
                }
            }
            catch (e) {
                friendIds = [];
            }
            let currentUserObj = await GameManager.getCurrentUser();
            // For Pong, we don't know the userIds of game owners here, so we show all friends except self
            const filteredPeople = people.filter(person => person.id !== currentUserObj.id && friendIds.includes(person.id));
            const friendsSection = details.querySelector('.friendsSection');
            if (friendsSection) {
                friendsSection.outerHTML = renderFriendList(filteredPeople);
                // Reattach listeners on new friendName elements
                const newFriendsSection = details.querySelector('.friendsSection');
                if (newFriendsSection) {
                    const friendNames = newFriendsSection.querySelectorAll('.friendName');
                    friendNames.forEach(friendName => {
                        friendName.addEventListener('click', () => {
                            var _a;
                            const username = friendName.getAttribute('data-username');
                            const profilePicture = friendName.getAttribute('data-profile-picture') || 'default-profile.png';
                            const bio = friendName.getAttribute('data-bio') || 'No bio available';
                            // We can't get userId here without access to people, so we search for it again
                            const userId = ((_a = people.find((person) => person.username === username)) === null || _a === void 0 ? void 0 : _a.id) || 0;
                            // showProfileCard is indirectly imported via showGameDetails
                            import('../../pages/community/peopleList.js').then(mod => {
                                mod.showProfileCard(username, profilePicture, bio, userId);
                            });
                        });
                    });
                }
            }
        }
    });
    // Centralized error handling for matchmaking (1v1, 1v1v1, tournament)
    socket.on('error', (data) => {
        var _a, _b, _c, _d;
        // Display error notification with explicit message
        let msg = data && data.message ? data.message : 'Unknown error.';
        // If backend message is generic, we specify for tournament
        if (/tournoi|tournament/i.test(msg)) {
            msg = 'Already registered for the tournament.';
        }
        showErrorNotification(msg);
        // Redirect to appropriate menu based on error message
        let menuTarget = 'multi';
        if (/tournoi|tournament/i.test(msg)) {
            menuTarget = 'tournament';
        }
        // Complete cleanup of menuLayer before changing menu
        if (PongMenuManager.instance && PongMenuManager.instance.menuLayer) {
            (_b = (_a = PongMenuManager.instance.menuLayer).removeChildren) === null || _b === void 0 ? void 0 : _b.call(_a);
            (_d = (_c = PongMenuManager.instance.menuLayer).clear) === null || _d === void 0 ? void 0 : _d.call(_c);
        }
        if (PongMenuManager.instance && typeof PongMenuManager.instance.changeMenu === 'function') {
            PongMenuManager.instance.changeMenu(menuTarget);
        }
        else if (typeof displayMenu === 'function') {
            displayMenu().then(() => {
                var _a, _b, _c, _d;
                if (PongMenuManager.instance && PongMenuManager.instance.menuLayer) {
                    (_b = (_a = PongMenuManager.instance.menuLayer).removeChildren) === null || _b === void 0 ? void 0 : _b.call(_a);
                    (_d = (_c = PongMenuManager.instance.menuLayer).clear) === null || _d === void 0 ? void 0 : _d.call(_c);
                }
                if (PongMenuManager.instance && typeof PongMenuManager.instance.changeMenu === 'function') {
                    PongMenuManager.instance.changeMenu(menuTarget);
                }
            });
        }
    });
}
// En haut du fichier
function onKeyDown(e) {
    if (!ready || gameover)
        return;
    // --- CLASSIC PONG ---
    if (modePong) {
        // Prevent spectators from controlling if mySide is undefined/null
        if (typeof mySide !== 'number' || mySide < 0)
            return;
        if (soloMode) {
            // 2 paddles played locally: 0→A/D, 1→←/→
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
            // multi: each player controls THEIR side
            if (mySide === 0) {
                if (e.code === 'KeyD')
                    sendMove(0, 'up');
                else if (e.code === 'KeyA')
                    sendMove(0, 'down');
            }
            else {
                if (e.code === 'KeyD')
                    sendMove(1, 'up');
                else if (e.code === 'KeyA')
                    sendMove(1, 'down');
            }
        }
        return;
    }
    // --- TRI-PONG ---
    if (!soloTri) {
        // multi-Tri: each client only controls THEIR side with A/D
        if (e.code === 'KeyD')
            sendMoveTri(mySide, 'up');
        else if (e.code === 'KeyA')
            sendMoveTri(mySide, 'down');
        return;
    }
    // solo-Tri: control 3 pads with A/D, J/L, Arrows
    const codes = ['KeyA', 'KeyD', 'KeyJ', 'KeyL', 'ArrowLeft', 'ArrowRight'];
    if (!codes.includes(e.code))
        return;
    let side = ['KeyA', 'KeyD'].includes(e.code) ? 0
        : ['KeyJ', 'KeyL'].includes(e.code) ? 1
            : 2;
    const dir = ['KeyD', 'KeyL', 'ArrowRight'].includes(e.code) ? 'up' : 'down';
    sendMoveTri(side, dir);
}
function onKeyUp(e) {
    if (!ready || gameover)
        return;
    // --- CLASSIC PONG ---
    if (modePong) {
        // Prevent spectators from controlling if mySide is undefined/null
        if (typeof mySide !== 'number' || mySide < 0)
            return;
        if (soloMode) {
            if (['KeyD', 'KeyA'].includes(e.code))
                sendMove(0, null);
            else if (['ArrowRight', 'ArrowLeft'].includes(e.code))
                sendMove(1, null);
        }
        else {
            if (e.code === 'KeyD' || e.code === 'KeyA')
                sendMove(mySide, null);
        }
        return;
    }
    // --- TRI-PONG ---
    if (!soloTri) {
        // multi-Tri: stop THEIR side with A/D
        if (e.code === 'KeyD' || e.code === 'KeyA')
            sendMoveTri(mySide, null);
        return;
    }
    // solo-Tri: stops with same keys
    const codes = ['KeyA', 'KeyD', 'KeyJ', 'KeyL', 'ArrowLeft', 'ArrowRight'];
    if (!codes.includes(e.code))
        return;
    let side = ['KeyA', 'KeyD'].includes(e.code) ? 0
        : ['KeyJ', 'KeyL'].includes(e.code) ? 1
            : 2;
    sendMoveTri(side, null);
}
// Initialise le canvas et le contexte
export function startPong() {
    console.log('startpong lance');
    const modal = document.getElementById('games-modal');
    if (modal)
        modal.innerHTML = '<canvas id="gameCanvas" style="width: 1200px; height: 800px;"></canvas>';
    running = true;
    canvas = document.querySelector('#gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CW;
    canvas.height = CH;
    initPauseMenu(canvas, ctx, displayMenu);
    // --- Plus besoin de startExplosionAnimation ici ---
}
export function initTournamentPong(side, you, opponent) {
    // 1) Replicate what onMatchFound + startPong did, but in tournament mode
    modePong = true;
    soloTri = false;
    soloMode = false; // tournament = 1v1 match, so never solo
    mySide = typeof side === 'number' ? side : -1; // -1 for spectator
    playerName = you;
    opponentName = opponent;
    lastState = null;
    ready = true;
    firstFrame = false;
    // 2) Create <canvas> (same as startPong)
    const modal = document.getElementById('games-modal');
    if (modal) {
        modal.innerHTML = '<canvas id="gameCanvas" style="width: 1200px; height: 800px;"></canvas>';
    }
    running = true;
    canvas = document.querySelector('#gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = CW; // 1200
    canvas.height = CH; // 800
    socket.off('matchFound');
    socket.off('matchFoundTri');
    socket.off('stateUpdateTri');
    // 3) Initialize pause menu (same as startPong)
    initPauseMenu(canvas, ctx, displayMenu);
}
// Ajout de la gestion du message de fin de partie
let pongGameId = null;
async function getPongGameId() {
    if (pongGameId !== null)
        return pongGameId;
    try {
        const res = await fetch('/api/games/getAll', { credentials: 'include' });
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
            const pong = data.games.find((g) => g.name.toLowerCase() === 'pong');
            if (pong) {
                pongGameId = pong.id;
                return pong.id;
            }
        }
    }
    catch (e) {
        console.error("Erreur lors de la récupération de l'id Pong:", e);
    }
    return 1; // fallback
}
export async function renderGameOverMessage(state) {
    // Only show message in multi mode
    if (soloMode)
        return;
    const player = state.paddles[mySide];
    const opponent = state.paddles.find((_, index) => index !== mySide);
    if (!opponent) {
        console.error('Unable to retrieve opponent information.');
        return;
    }
}
export function resetGame() {
    ready = false;
    gameover = false;
    firstFrame = false;
    lastState = null;
}
export function hideGameCanvasAndShowMenu() {
    // Hide the game canvas if it exists
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        gameCanvas.style.display = 'none';
    }
    // Show the Konva menu layer if it exists
    const gamesModal = document.getElementById('games-modal');
    if (gamesModal) {
        // If the Konva stage is still present, force a redraw
        // (the menu manager will handle this in its event)
        gamesModal.style.display = '';
    }
}
// Global handler for all matchmaking/tournament errors
socket.on('error', (data) => {
    if (data && data.message) {
        let msg = data.message;
        if (/tournoi|tournament/i.test(msg)) {
            msg = 'You are already registered for the tournament.';
        }
        showErrorNotification(msg);
        // Redirect to appropriate menu
        if (PongMenuManager.instance && typeof PongMenuManager.instance.changeMenu === 'function') {
            if (/tournoi|tournament/i.test(msg)) {
                PongMenuManager.instance.changeMenu('tournament');
            }
            else {
                PongMenuManager.instance.changeMenu('main');
            }
        }
        else {
            displayMenu();
        }
    }
});
// Nouvelle fonction pour réinitialiser l'état du tournoi
export function resetPongTournamentState() {
    mySide = -1;
    roomId = '';
    soloMode = false;
    modePong = false;
    soloTri = false;
    running = false;
    ready = false;
    lastState = null;
    firstFrame = false;
    gameover = false;
    user1Id = null;
    user2Id = null;
    showTutorial = false;
    playerName = '';
    opponentName = '';
    playerNames = [];
    isPrivateLobby = false;
}
