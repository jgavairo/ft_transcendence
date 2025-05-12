import { initTriPong } from '../TriPong.js';
import { displayPlayMenu } from './PlayMenu.js';


  export function displayMenu(): void {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
  
    const menuBg = new Image();
    menuBg.src = '../../../../assets/games/pong/background.png';

    // Fonction pour dessiner le menu complet (fond + boutons)
    function drawMenu() {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(menuBg, 0, 0, cw, ch);

        // Paramètres des boutons
        const buttonWidth = 300;
        const buttonHeight = 100;
        const playY = ch / 2 - 60;
        const quitY = ch / 2 + 90;
        const centerX = (cw - buttonWidth) / 2 - 10;

        // Dessiner le bouton PLAY
        ctx.fillStyle = "#294162";
        ctx.fillRect(centerX, playY, buttonWidth, buttonHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.strokeRect(centerX, playY, buttonWidth, buttonHeight);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PLAY", centerX + buttonWidth / 2, playY + buttonHeight / 2);

        // Dessiner le bouton SHOP
        ctx.fillStyle = "#294162";
        ctx.fillRect(centerX, quitY, buttonWidth, buttonHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.strokeRect(centerX, quitY, buttonWidth, buttonHeight);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 40px Arial";
        ctx.fillText("QUIT", centerX + buttonWidth / 2, quitY + buttonHeight / 2);
    }

    if (menuBg.complete) {
        drawMenu();
    } else {
        menuBg.onload = () => {
            drawMenu();
        };
    }
  
    const buttonWidth = 300;
    const buttonHeight = 100;
    const playY = ch / 2 - 60;
    const quitY = ch / 2 + 90;
    const centerX = (cw - buttonWidth) / 2 - 10;
  
    const handler = (e: MouseEvent) => {
      const { left, top } = canvas.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      if (x >= centerX && x <= centerX+buttonWidth) {
        if (y >= playY && y <= playY+buttonHeight) {
          canvas.removeEventListener('click', handler);
          displayPlayMenu();
        } else if (y >= quitY && y <= quitY+buttonHeight) {
          canvas.removeEventListener('click', handler);
          const modal = document.getElementById('optionnalModal');
          if (!modal) 
            return;
          modal.innerHTML = '';
          return;
        }
      }
    };
    canvas.addEventListener('click', handler);
  }
  

  window.addEventListener('DOMContentLoaded', () => {
    const btnTri = document.getElementById('btnTriPong');
    if (!btnTri) {
      console.warn('btnTriPong introuvable dans le DOM');
      return;
    }
    btnTri.addEventListener('click', () => {
      const input = document.getElementById('usernameInput') as HTMLInputElement;
      const username = input && input.value.trim() !== '' 
                       ? input.value.trim() 
                       : 'Player';
      initTriPong(username);
    });
  });