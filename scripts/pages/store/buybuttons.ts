import { showNotification } from "../../helpers/notifications.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { GameManager } from "../../managers/gameManager.js";
import { gameInfosModalHTML } from "../../sourcepage.js";
import api from "../../helpers/api.js";
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

export function setupCard()
{
    const gameCards = document.querySelectorAll('.gamecard');
    gameCards.forEach(card => {
        card.addEventListener('click', async () => {
            // Récupérer l'ID de la carte (format: "nomdujeucard")
            const cardId = card.id;
            const gameName = cardId.replace('card', '');
            
            console.log("CARD CLICKED " + gameName);
            // Récupérer la liste des jeux
            const gameList = await GameManager.getGameList();
            // Trouver le jeu correspondant
            const game = gameList.find(g => g.name === gameName);
            if (!game) 
            {
                console.log("GAME NOT FOUND");
                return;
            }
            console.log("GAME FOUND:", JSON.stringify(game, null, 2));
            // Insérer le contenu dans le modal
            const inLibrary = await UserLibraryManager.hasGame(game.id);
            console.log("Game in library:", inLibrary);
            const modal = document.getElementById('optionnalModal') as HTMLElement;
            if (modal) 
                modal.innerHTML = gameInfosModalHTML(game, inLibrary);
            const overlay = document.getElementById('modalOverlay') as HTMLElement;
            const buyButton = document.querySelector('.buybutton') as HTMLButtonElement;
            if (buyButton)
            {
                buyButton.addEventListener('click', async () => {
                    console.log("BUY BUTTON CLICKED");
                    try {
                        const response = await api.post('/api/user/addGame', { gameId: game.id });
                        const data = await response.json();
                        console.log("RESPONSE:", data);
                        
                        if (data.success) {
                            console.log("Game added to library and stats initialized.");
                            // Met à jour l'apparence du bouton
                            buyButton.textContent = 'Already in library';
                            buyButton.classList.replace('buybutton', 'owned-button');
                            buyButton.disabled = true;
            
                            // Affiche une notification
                            showNotification('Game added to your library!');
                        } else {
                            console.error('Failed to add game to library:', data);
                        }
                    } catch (error) {
                        console.error('Error adding game to library:', error);
                    }
                });
            }
            const closeButton = document.querySelector('.closeGameInfosModal') as HTMLButtonElement;
            if (closeButton)
                closeButton.addEventListener('click', () => {
                    modal.innerHTML = "";
                });
        });
    });
}
