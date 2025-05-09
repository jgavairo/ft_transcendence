// scripts/games/pong/MultiMenu.ts
import { connectPong, joinQueue } from './pongGame.js';
import { displayWaitingScreen } from './WaitingScreen.js';
import { displayPlayMenu } from './PlayMenu.js';
import { displayMatchFound } from './DisplayMatchFound.js';
import { connectTriPong, joinTriQueue } from './TriPong.js';
import { GameManager } from '../../managers/gameManager.js';

export function displayMultiMenu(): void {
  // 1) Assure-toi d'être connecté / d'avoir installé les handlers
  connectPong();
  connectTriPong();

  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  canvas.width = cw; canvas.height = ch;

  // Fond & titre
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = 'white';
  ctx.font = '36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Multi Mode', cw/2, ch*0.2);

  interface Button { label: string; x: number; y: number; w: number; h: number; onClick: () => void; }
  const btnW = 250, btnH = 60, spacing = 30;
  const startY = ch*0.35, x0 = cw/2 - btnW/2;

  const buttons: Button[] = [
    {
      label: '2 Players',
      x: x0, y: startY, w: btnW, h: btnH,
      onClick: async () => {
        console.log('2 Players clicked');
        teardown();
        displayWaitingScreen();
        
        // Récupérer le nom réel de l'utilisateur actuel
        try {
          const currentUser = await GameManager.getCurrentUser();
          const username = currentUser?.username || "Player1";
          console.log('Current user for matchmaking:', username);
          joinQueue(username);
        } catch (error) {
          console.error('Error getting current user:', error);
          joinQueue("Player1"); // Fallback au nom par défaut en cas d'erreur
        }
      }
    },
    {
      label: '3 Players',
      x: x0, y: startY + (btnH + spacing),
      w: btnW, h: btnH,
      onClick: async () => {
        teardown();
        displayWaitingScreen();
        
        // Récupérer le nom réel de l'utilisateur actuel
        try {
          const currentUser = await GameManager.getCurrentUser();
          const username = currentUser?.username || "Player1";
          console.log('Current user for tri-matchmaking:', username);
          joinTriQueue(username);
        } catch (error) {
          console.error('Error getting current user:', error);
          joinTriQueue("Player1"); // Fallback au nom par défaut en cas d'erreur
        }
      }
    },
    {
      label: 'Back',
      x: x0, y: startY + 2*(btnH + spacing),
      w: btnW, h: btnH,
      onClick: () => {
        teardown();
        displayPlayMenu();
      }
    }
  ];

  // Dessin
  buttons.forEach(btn => {
    ctx.fillStyle = '#222';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w/2, btn.y + btn.h/2);
  });

  // Gestion du clic
  const handler = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const btn of buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
        btn.onClick();
        break;
      }
    }
  };
  canvas.addEventListener('click', handler);

  function teardown() {
    canvas.removeEventListener('click', handler);
  }
}
