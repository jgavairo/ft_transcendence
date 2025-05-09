import { gameModalHTML } from "../../sourcepage.js";
import { displayMenu } from "./DisplayMenu.js";

export function launchPong() 
{
    console.log("Pong main");
    const modal = document.getElementById('optionnalModal');
    if (!modal) return;
    modal.innerHTML = gameModalHTML;
    displayMenu();
};
