import { showNotification } from "../../helpers/notifications.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { GameManager } from "../../managers/gameManager.js";

export function setupBuyButtons() {
    const buyButtons = document.querySelectorAll('.buybutton');
    if (!buyButtons) {
        console.error('Buy buttons not found');
        return;
    }
    buyButtons.forEach(async (button) => {
        button.addEventListener('click', async (e) => {
            console.log("BUY BUTTON CLICKED");
            const gameList = await GameManager.getGameList();
            const gameCard = (e.target as HTMLElement).closest('.gamecard');
            if (!gameCard) return;
            
            const gameId = gameList.find(g => g.name + 'card' === gameCard.id)?.id;
            if (gameId === undefined) return;
            
            // Appeler l'API pour ajouter le jeu à la bibliothèque
            const response = await fetch('/api/user/addGame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });

            if (response.ok) {
                console.log("Game added to library and stats initialized.");
                // Met à jour l'apparence du bouton
                const button = e.target as HTMLButtonElement;
                button.textContent = 'Already in library';
                button.classList.replace('buybutton', 'owned-button');
                button.disabled = true;

                // Affiche une notification
                showNotification('Game added to your library!');
            } else {
                console.error('Failed to add game to library:', await response.json());
            }
        });
    });
}