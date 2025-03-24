import { gameList } from "./gameStoreList.js";
import { setupLibrary } from "./library.js";
import { UserLibraryManager } from "./userLibrary.js";

export function setupStore() 
{
    const storeContainer = document.querySelector('.gamescontainer');

    if (!storeContainer) {
        console.error('Store container not found');
        return;
    }

    gameList.forEach(game => {
        const inLibrary = UserLibraryManager.hasGame(game.id);
        const gamesHTML = `
            <div class="gamecard" id="${game.name}card">
                <div class="flex">
                    <img src="${game.image}" class="gamecard-logo" alt="${game.name}-logo">
                    <div class="gamedescription">
                        <h4 class="textdescription" id="${game.name}description">
                            ${game.description}
                        </h4>    
                    </div>
                </div>
                <h3 class="gametitle" id="${game.name}title">${game.name}</h3>
                <h4 class="price" id="${game.name}price">
                    ${game.price === 0 ? 'Free' : `${game.price}$`}
                </h4>
                <button 
                    class="${inLibrary ? 'owned-button' : 'buybutton'}" 
                    id="${game.name}buybutton"
                    ${inLibrary ? 'disabled' : ''}
                >
                    ${inLibrary ? 'Already in library' : 'Add to library'}
                </button>
            </div>
        `;
        storeContainer.innerHTML += gamesHTML;
    });

    // Ajoute les écouteurs d'événements pour les boutons d'achat
    setupBuyButtons();
}

function setupBuyButtons() 
{
    const buyButtons = document.querySelectorAll('.buybutton');
    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const gameCard = (e.target as HTMLElement).closest('.gamecard');
            if (!gameCard) return;

            const gameId = gameList.find(g => g.name + 'card' === gameCard.id)?.id;
            if (gameId === undefined) return;

            // Ajoute le jeu à la bibliothèque
            UserLibraryManager.addGame(gameId);

            // Met à jour l'apparence du bouton
            const button = e.target as HTMLButtonElement;
            button.textContent = 'Already in library';
            button.classList.replace('buybutton', 'owned-button');
            button.disabled = true;

            // Affiche une notification
            showNotification('Game added to your library!');
        });
    });
}

function showNotification(message: string) 
{
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', setupStore);
