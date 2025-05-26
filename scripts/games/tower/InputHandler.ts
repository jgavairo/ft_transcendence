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
        // Supprimer l'event listener du clavier
        window.removeEventListener("keydown", (event) =>
        {
            if (event.code === 'Escape') 
            {
                this.pauseMenu.toggle();
            }
        });
        // Nettoyer le menu pause
        if (this.pauseMenu) 
        {
            this.pauseMenu.destroy();
        }
    }
}