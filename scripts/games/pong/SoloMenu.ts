import { socket } from './pongGame.js';
import { connectTriPong, startTriPong } from './TriPong.js';
import { displayPlayMenu } from './PlayMenu.js';

export function displaySoloMenu(): void {
    const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const cw = canvas.clientWidth,
    ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    
    // Fond & titre
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Local Mode', cw/2, ch*0.2);
    
    interface Button { label: string; x: number; y: number; w: number; h: number; onClick: () => void; }
    const btnW = 250, btnH = 60, spacing = 30;
    const startY = ch*0.35, x0 = cw/2 - btnW/2;
    
    const buttons: Button[] = [
      {
        label: '1 Player', x: x0, y: startY,
        w: btnW, h: btnH,
        onClick: () => {
          // TODO: implémenter 1 player
          console.log('1 Player');
        }
      },
      {
        label: '2 Players', x: x0, y: startY + (btnH + spacing),
        w: btnW, h: btnH,
        onClick: () => {
          // Lance la partie pour 2 joueurs (reprise du solo)
          teardownSolo();
          socket.emit('startSolo', { username: 'Player1' });
        }
      },
      {
        label: '3 Players', x: x0, y: startY + 2*(btnH + spacing),
        w: btnW, h: btnH,
        onClick: () => {
          teardownSolo();
          startTriPong();
        }
      },
      {
        label: 'Back',
        x: x0, y: startY + 3*(btnH+spacing),
        w: btnW, h: btnH,
        onClick: () => {
          displayPlayMenu();
        }
      }
    ];
    
    // Dessin des boutons
    buttons.forEach(btn => {
      ctx.fillStyle = '#222';
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.w/2, btn.y + btn.h/2);
    });
    
    // Handler global
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
    
    function teardownSolo() {
      canvas.removeEventListener('click', handler);
    }
  }
  