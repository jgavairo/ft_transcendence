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
            var _a;
            console.log("BUY BUTTON CLICKED");
            const gameList = await GameManager.getGameList();
            const gameCard = e.target.closest('.gamecard');
            if (!gameCard)
                return;
            const gameId = (_a = gameList.find(g => g.name + 'card' === gameCard.id)) === null || _a === void 0 ? void 0 : _a.id;
            if (gameId === undefined)
                return;
            // Ajoute le jeu à la bibliothèque
            await UserLibraryManager.addGame(gameId);
            console.log("IN SETUP BUY BUTTON CLICKED");
            // Met à jour l'apparence du bouton
            const button = e.target;
            button.textContent = 'Already in library';
            button.classList.replace('buybutton', 'owned-button');
            button.disabled = true;
            // Affiche une notification
            showNotification('Game added to your library!');
        });
    });
}
