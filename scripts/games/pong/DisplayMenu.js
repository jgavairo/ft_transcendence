import { startTriPong } from './TriPong.js';
import { socket, menuBg, shopBg, setMode, setSelectedPaddleColor } from './pongGame.js';
export function displayWaitingScreen() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Waiting for opponent...', canvas.width / 2, canvas.height / 2 - 40);
}
export function displayMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    if (menuBg.complete) {
        ctx.drawImage(menuBg, 0, 0, cw, ch);
    }
    else {
        menuBg.onload = () => {
            ctx.drawImage(menuBg, 0, 0, cw, ch);
        };
    }
    const buttonWidth = 300;
    const buttonHeight = 100;
    const playY = ch / 2 - 60;
    const shopY = ch / 2 + 90;
    const centerX = (cw - buttonWidth) / 2 - 10;
    const handler = (e) => {
        const { left, top } = canvas.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        if (x >= centerX && x <= centerX + buttonWidth) {
            if (y >= playY && y <= playY + buttonHeight) {
                canvas.removeEventListener('click', handler);
                displayPlayMenu();
            }
            else if (y >= shopY && y <= shopY + buttonHeight) {
                canvas.removeEventListener('click', handler);
                displayShopMenu();
            }
        }
    };
    canvas.addEventListener('click', handler);
}
export function displaySoloMenu() {
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
    ctx.fillText('Local Mode', cw / 2, ch * 0.2);
    const btnW = 250, btnH = 60, spacing = 30;
    const startY = ch * 0.35, x0 = cw / 2 - btnW / 2;
    const buttons = [
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
            label: '3 Players', x: x0, y: startY + 2 * (btnH + spacing),
            w: btnW, h: btnH,
            onClick: () => {
                teardownSolo();
                startTriPong();
            }
        },
        {
            label: 'Back',
            x: x0, y: startY + 3 * (btnH + spacing),
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
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    });
    // Handler global
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
    function teardownSolo() {
        canvas.removeEventListener('click', handler);
    }
}
export function displayShopMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const options = [
        { name: 'Skin1', image: '/scripts/games/pong/assets/skin1.png' },
        { name: 'Skin2', image: '/scripts/games/pong/assets/skin2.png' },
        { name: 'Skin3', image: '/scripts/games/pong/assets/skin3.png' }
    ];
    const buttonSize = 150;
    const spacing = 90;
    const totalWidth = options.length * buttonSize + (options.length - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2 - 20;
    const buttonY = canvas.height / 2 - buttonSize / 2 - 40;
    if (shopBg.complete) {
        ctx.drawImage(shopBg, 0, 0, canvas.width, canvas.height);
    }
    else {
        shopBg.onload = () => {
            ctx.drawImage(shopBg, 0, 0, canvas.width, canvas.height);
        };
    }
    options.forEach((option, index) => {
        const x = startX + index * (buttonSize + spacing);
        const img = new Image();
        img.src = option.image;
        img.onload = () => {
            ctx.drawImage(img, x, buttonY, buttonSize, buttonSize);
        };
    });
    const backWidth = 120;
    const backHeight = 40;
    const backX = 175;
    const backY = canvas.height - backHeight - 100;
    const onClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        options.forEach((option, index) => {
            const x = startX + index * (buttonSize + spacing);
            if (mouseX >= x &&
                mouseX <= x + buttonSize &&
                mouseY >= buttonY &&
                mouseY <= buttonY + buttonSize) {
                setSelectedPaddleColor(option.name);
                canvas.removeEventListener('click', onClick);
                displayMenu();
            }
        });
        if (mouseX >= backX &&
            mouseX <= backX + backWidth &&
            mouseY >= backY &&
            mouseY <= backY + backHeight) {
            canvas.removeEventListener('click', onClick);
            displayMenu();
        }
    };
    canvas.addEventListener('click', onClick);
}
export function displayPlayMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // — Fond & titre —
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
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
                setMode('solo');
                teardown();
                displaySoloMenu();
            }
        },
        {
            label: 'Multijoueur',
            x: x0, y: startY + (btnH + spacing),
            w: btnW, h: btnH,
            onClick: () => {
                setMode('multi');
                teardown();
                socket.emit('joinQueue', { playerId: socket.id, username: 'Player1' });
                displayWaitingScreen();
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
