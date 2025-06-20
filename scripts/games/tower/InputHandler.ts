import { GameClient } from "./GameClient.js";
import { PauseMenu } from "./PauseMenu.js";

export class InputHandler
{
    private pauseMenu: PauseMenu;

    constructor(private client: GameClient) 
    {
        this.pauseMenu = new PauseMenu(client);

        window.addEventListener("keydown", (event) =>
        {
            if (event.code === 'Escape') 
            {
                this.pauseMenu.toggle();
            }
        });
    }

    public cleanup() {
        // Remove the keyboard event listener
        window.removeEventListener("keydown", (event) =>
        {
            if (event.code === 'Escape') 
            {
                this.pauseMenu.toggle();
            }
        });
        // Clean up the pause menu
        if (this.pauseMenu) 
        {
            this.pauseMenu.destroy();
        }
    }
}