// scripts/games/pong/MultiMenu.ts
import { connectPong, joinQueue } from './pongGame.js';
import { displayWaitingScreen } from './WaitingScreen.js';
import { displayPlayMenu } from './PlayMenu.js';
import { connectTriPong, joinTriQueue } from './TriPong.js';
export function displayMultiMenu() {
    // 1) Assure-toi d'être connecté / d'avoir installé les handlers
    connectPong();
    connectTriPong();
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // Fond & titre
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Multi Mode', cw / 2, ch * 0.2);
    const btnW = 250, btnH = 60, spacing = 30;
    const startY = ch * 0.35, x0 = cw / 2 - btnW / 2;
    const buttons = [
        {
            label: '2 Players',
            x: x0, y: startY, w: btnW, h: btnH,
            onClick: () => {
                console.log('2 Players clicked');
                teardown();
                displayWaitingScreen();
                // socket.once('matchFound', data => {
                //   displayMatchFound(`${data.you} vs ${data.opponent}`);
                // });
                joinQueue('Player1');
            }
        },
        {
            label: '3 Players',
            x: x0, y: startY + (btnH + spacing),
            w: btnW, h: btnH,
            onClick: () => {
                teardown();
                displayWaitingScreen();
                // socket.once('matchFoundTri', data => {
                //   displayMatchFound(data.players.join(' vs '));
                // });
                joinTriQueue('Player1');
            }
        },
        {
            label: 'Back',
            x: x0, y: startY + 2 * (btnH + spacing),
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
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });
    // Gestion du clic
    const handler = (e) => {
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
