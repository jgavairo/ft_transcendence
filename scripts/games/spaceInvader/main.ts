import { gameModalHTML } from "../../sourcepage.js";
import { game } from "./script.js";

export function launchSpaceInvader() 
{
    console.log("Space Invader main");
    const modal = document.getElementById('optionnalModal');
    if (!modal) return;
    
    // Créer un élément style pour le CSS
    const style = document.createElement('style');
    style.textContent = `
        .game-modal #gameCanvas {
            background: url('https://marclopezavila.github.io/planet-defense-game/img/space.jpg') no-repeat;
            width: 100%;
            height: 100%;
            background-size: cover;
        }
        .game-modal #gameCanvas.playing {
            cursor: url('https://marclopezavila.github.io/planet-defense-game/img/aim_red.png') 17.5 17.5,auto !important;
        }
    `;
    document.head.appendChild(style);
    
    modal.innerHTML = gameModalHTML;
    game();
};
