import { gameModalHTML } from "../../sourcepage.js";
import { displayMenu } from "./menu/DisplayMenu.js";
import { displayMenuFromLink } from "./menu/DisplayMenu.js";
export function launchPong() {
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    modal.innerHTML = gameModalHTML;
    displayMenu();
}
;
export function launchPongFromLink(roomId) {
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    modal.innerHTML = gameModalHTML;
    displayMenuFromLink(roomId);
}
