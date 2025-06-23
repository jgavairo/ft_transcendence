import { PauseMenu } from "./PauseMenu.js";
export class InputHandler {
    constructor(client) {
        this.client = client;
        this.pauseMenu = new PauseMenu(client);
        this.handleKeyDown = (event) => {
            if (event.code === 'Escape') {
                this.pauseMenu.toggle();
            }
        };
        window.addEventListener("keydown", this.handleKeyDown);
    }
    cleanup() {
        // Remove the keyboard event listener
        window.removeEventListener("keydown", this.handleKeyDown);
        // Clean up the pause menu
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
        }
    }
}
