import { displayWaitingScreen } from './WaitingScreen.js';
import { displayMultiMenu } from "./MultiMenu.js";
import { displaySoloMenu } from './SoloMenu.js';
import { displayMenu, menuBg } from './DisplayMenu.js';
export function displayPlayMenu() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // — Fond & titre —
    ctx.drawImage(menuBg, 0, 0, cw, ch);
    ctx.fillStyle = 'white';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Choose a gamemode', cw / 2, ch * 0.2);
    const btnW = 300, btnH = 70, spacing = 30;
    const startY = ch * 0.35;
    const x0 = cw / 2 - btnW / 2;
    const buttons = [
        {
            label: 'Solo',
            x: x0, y: startY,
            w: btnW, h: btnH,
            onClick: () => {
                teardown();
                displaySoloMenu();
            }
        },
        {
            label: 'Multijoueur',
            x: x0, y: startY + (btnH + spacing),
            w: btnW, h: btnH,
            onClick: () => {
                teardown();
                displayMultiMenu();
            }
        },
        {
            label: 'Tournoi',
            x: x0, y: startY + 2 * (btnH + spacing),
            w: btnW, h: btnH,
            onClick: () => {
                teardown();
                // Implémente ta logique tournoi ici, p.ex. :
                // gameSocket.emit('startTournament', { username: 'Player1' });
                displayWaitingScreen();
            }
        },
        {
            label: 'Back',
            x: x0, y: startY + 3 * (btnH + spacing),
            w: btnW, h: btnH,
            onClick: () => {
                teardown();
                displayMenu();
            }
        }
    ];
    // — Dessin des boutons —
    buttons.forEach(btn => {
        ctx.fillStyle = '#222';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = 'white';
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });
    // — Handler global pour détecter les clics sur un bouton —
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
    // Permet de nettoyer le listener lorsqu'on quitte ce menu
    function teardown() {
        canvas.removeEventListener('click', handler);
    }
}
