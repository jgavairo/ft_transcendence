import { resetGame, connectPong } from './pongGame.js';
import { socket } from './network.js';
import { displayMenu } from './DisplayMenu.js';
let gameOverOverlay = null;
export function showGameOverOverlay() {
    if (gameOverOverlay)
        return;
    // 1) Crée le wrapper fixed
    gameOverOverlay = document.createElement('div');
    gameOverOverlay.id = 'gameOverOverlay';
    Object.assign(gameOverOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999',
    });
    // 2) Crée un petit panneau centré
    const panel = document.createElement('div');
    Object.assign(panel.style, {
        textAlign: 'center',
        color: 'white'
    });
    const title = document.createElement('h1');
    title.textContent = 'Game Finish';
    Object.assign(title.style, {
        marginBottom: '0.5em',
        fontSize: '3em'
    });
    const btnMenu = document.createElement('button');
    btnMenu.textContent = 'Main Menu';
    Object.assign(btnMenu.style, {
        display: 'block',
        margin: '1em auto',
        padding: '0.5em 1.5em',
        fontSize: '1.2em',
        cursor: 'pointer'
    });
    panel.appendChild(title);
    panel.appendChild(btnMenu);
    gameOverOverlay.appendChild(panel);
    document.body.appendChild(gameOverOverlay);
    btnMenu.addEventListener('click', () => {
        console.log('🧹 Clean up before returning to menu');
        // 1) Stoppe la boucle de jeu en mémoire
        resetGame();
        // 2) Déconnecte vraiment la socket et enlève **tous** ses listeners
        socket.removeAllListeners();
        socket.disconnect();
        // 3) Supprime l’overlay
        gameOverOverlay.remove();
        gameOverOverlay = null;
        // 4) Remets le menu principal à l’écran
        displayMenu();
        // (re)crée une connexion toute propre
        socket.connect();
        connectPong();
    });
}
