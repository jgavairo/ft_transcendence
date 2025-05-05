import { displayMenu } from './DisplayMenu.js';
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
