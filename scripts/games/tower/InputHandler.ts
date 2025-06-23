import { GameClient } from "./GameClient.js";
import { PauseMenu } from "./PauseMenu.js";

export class InputHandler
{
    private pauseMenu: PauseMenu;
    private handleKeyDown: (event: KeyboardEvent) => void;

    constructor(private client: GameClient) 
    {
        this.pauseMenu = new PauseMenu(client);

        this.handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Escape') 
            {
                this.pauseMenu.toggle();
            }
        };

        window.addEventListener("keydown", this.handleKeyDown);
    }

    public cleanup() {
        // Remove the keyboard event listener
        window.removeEventListener("keydown", this.handleKeyDown);
        
        // Clean up the pause menu
        if (this.pauseMenu) 
        {
            this.pauseMenu.destroy();
        }
    }
}