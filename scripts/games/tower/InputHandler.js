import { PauseMenu } from "./PauseMenu.js";
export class InputHandler {
    constructor(client) {
        this.client = client;
        this.pauseMenu = new PauseMenu(client);
        window.addEventListener("keydown", (event) => {
            if (event.code === 'Escape') {
                this.pauseMenu.toggle();
            }
        });
    }
    cleanup() {
        // Supprimer l'event listener du clavier
        window.removeEventListener("keydown", (event) => {
            if (event.code === 'Escape') {
                this.pauseMenu.toggle();
            }
        });
        // Nettoyer le menu pause
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
        }
    }
}
