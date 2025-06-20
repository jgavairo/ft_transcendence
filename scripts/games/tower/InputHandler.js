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
        // Remove the keyboard event listener
        window.removeEventListener("keydown", (event) => {
            if (event.code === 'Escape') {
                this.pauseMenu.toggle();
            }
        });
        // Clean up the pause menu
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
        }
    }
}
