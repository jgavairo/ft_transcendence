import { initTriPong } from '../TriPong.js';
import { displayPlayMenu } from './PlayMenu.js';
export const menuBg = new Image();
menuBg.src = '../../../../assets/games/pong/background.png';
// Fonction pour dessiner un bouton digital
function drawDigitalButton(ctx, button) {
    const { x, y, width, height, text, isHovered, isPressed } = button;
    // Couleurs
    const colors = {
        border: isHovered ? '#4b9cd3' : '#294162',
        fill: isPressed ? '#1a2a3a' : (isHovered ? '#2c3e50' : '#294162'),
        text: isHovered ? '#4b9cd3' : '#ffffff',
        glow: isHovered ? 'rgba(75, 156, 211, 0.3)' : 'transparent'
    };
    // Effet de glow
    if (isHovered) {
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 15;
    }
    // Rectangle principal
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 3;
    // Coins arrondis
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Réinitialiser l'effet de glow
    ctx.shadowBlur = 0;
    // Texte
    ctx.fillStyle = colors.text;
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2);
}
export function displayMenu() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // Création des boutons
    const buttons = [
        {
            x: (cw - 300) / 2,
            y: ch / 2 - 60,
            width: 300,
            height: 100,
            text: "PLAY",
            isHovered: false,
            isPressed: false
        },
        {
            x: (cw - 300) / 2,
            y: ch / 2 + 90,
            width: 300,
            height: 100,
            text: "QUIT",
            isHovered: false,
            isPressed: false
        }
    ];
    // Fonction pour dessiner le menu
    function drawMenu() {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(menuBg, 0, 0, cw, ch);
        // Dessiner tous les boutons
        buttons.forEach(button => drawDigitalButton(ctx, button));
    }
    // Gestion des événements
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        buttons.forEach(button => {
            button.isHovered =
                mouseX >= button.x &&
                    mouseX <= button.x + button.width &&
                    mouseY >= button.y &&
                    mouseY <= button.y + button.height;
        });
        drawMenu();
    });
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        buttons.forEach(button => {
            if (button.isHovered) {
                button.isPressed = true;
                drawMenu();
            }
        });
    });
    canvas.addEventListener('mouseup', () => {
        buttons.forEach(button => {
            if (button.isPressed) {
                button.isPressed = false;
                if (button.text === "PLAY") {
                    displayPlayMenu();
                }
                else if (button.text === "QUIT") {
                    const modal = document.getElementById('optionnalModal');
                    if (modal)
                        modal.innerHTML = '';
                }
            }
        });
        drawMenu();
    });
    // Initialisation
    if (menuBg.complete) {
        drawMenu();
    }
    else {
        menuBg.onload = () => drawMenu();
    }
}
window.addEventListener('DOMContentLoaded', () => {
    const btnTri = document.getElementById('btnTriPong');
    if (!btnTri) {
        console.warn('btnTriPong introuvable dans le DOM');
        return;
    }
    btnTri.addEventListener('click', () => {
        const input = document.getElementById('usernameInput');
        const username = input && input.value.trim() !== ''
            ? input.value.trim()
            : 'Player';
        initTriPong(username);
    });
});
