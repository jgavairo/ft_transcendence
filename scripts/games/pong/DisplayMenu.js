import { menuBg } from './pongGame.js';
import { displayPlayMenu } from './PlayMenu.js';
import { displayShopMenu } from './ShopMenu.js';
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
