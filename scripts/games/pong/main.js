import { pongModalHTML } from "../../sourcepage.js";
import { displayMenu } from "./menu/DisplayMenu.js";
export function launchPong() {
    console.log("Pong main");
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    modal.innerHTML = pongModalHTML;
    displayMenu();
}
;
