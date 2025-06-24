import { showNotification } from "../../helpers/notifications.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { GameManager } from "../../managers/gameManager.js";
import { gameInfosModalHTML } from "../../sourcepage.js";
import api from "../../helpers/api.js";
export function setupBuyButtons() {
    const buyButtons = document.querySelectorAll('.buybutton');
    if (!buyButtons) {
        return;
    }
    buyButtons.forEach(async (button) => {
        button.addEventListener('click', async (e) => {
            var _a;
            const gameList = await GameManager.getGameList();
            const gameCard = e.target.closest('.gamecard');
            if (!gameCard)
                return;
            const gameId = (_a = gameList.find(g => g.name + 'card' === gameCard.id)) === null || _a === void 0 ? void 0 : _a.id;
            if (gameId === undefined)
                return;
            const response = await fetch('/api/user/addGame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ gameId }),
            });
            if (response.ok) {
                const button = e.target;
                button.textContent = 'Already in library';
                button.classList.replace('buybutton', 'owned-button');
                button.disabled = true;
                showNotification('Game added to your library!');
            }
            else {
                console.error('Failed to add game to library:', await response.json());
            }
        });
    });
}
export function setupCard() {
    const gameCards = document.querySelectorAll('.gamecard');
    gameCards.forEach(card => {
        card.addEventListener('click', async () => {
            const cardId = card.id;
            const gameName = cardId.replace('card', '');
            const gameList = await GameManager.getGameList();
            const game = gameList.find(g => g.name === gameName);
            if (!game) {
                console.error("GAME NOT FOUND");
                return;
            }
            const inLibrary = await UserLibraryManager.hasGame(game.id);
            const modal = document.getElementById('optionnalModal');
            if (modal)
                modal.innerHTML = gameInfosModalHTML(game, inLibrary);
            const overlay = document.getElementById('modalOverlay');
            if (overlay && modal) {
                overlay.addEventListener('click', (event) => {
                    if (event.target === overlay) {
                        modal.innerHTML = '';
                    }
                });
            }
            const buyButton = document.querySelector('.buybutton');
            if (buyButton) {
                buyButton.addEventListener('click', async () => {
                    try {
                        const response = await api.post('/api/user/addGame', { gameId: game.id });
                        const data = await response.json();
                        if (data.success) {
                            buyButton.textContent = 'Already in library';
                            buyButton.classList.replace('buybutton', 'owned-button');
                            buyButton.disabled = true;
                            showNotification('Game added to your library!');
                        }
                        else {
                            console.error('Failed to add game to library:', data);
                        }
                    }
                    catch (error) {
                        console.error('Error adding game to library:', error);
                    }
                });
            }
            const closeButton = document.querySelector('.closeGameInfosModal');
            if (closeButton)
                closeButton.addEventListener('click', () => {
                    modal.innerHTML = "";
                });
        });
    });
}
