import { resetGame, connectPong } from './pongGame.js';
import { socket } from './network.js';
import { displayMenu } from './DisplayMenu.js';

let gameOverOverlay: HTMLDivElement | null = null;

export function showGameOverOverlay() {
  if (gameOverOverlay) return;

  // 1) Crée le wrapper fixed
  gameOverOverlay = document.createElement('div');
  gameOverOverlay.id = 'gameOverOverlay';
  Object.assign(gameOverOverlay.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width:  '1200px',
    height: '800px',
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

    resetGame();

    socket.removeAllListeners();
    socket.disconnect();

    gameOverOverlay!.remove();
    gameOverOverlay = null;

    displayMenu();

    socket.connect();
    connectPong();
  });
}
