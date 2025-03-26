import { gameList } from "./gameStoreList.js";
import { UserLibraryManager } from "./userLibrary.js";
import { LoginManager } from "./loginModal.js";
export function setupStore() {
    const storeContainer = document.querySelector('.gamescontainer');
    if (!storeContainer) {
        console.error('Store container not found');
        return;
    }
    if (!LoginManager.isLoggedIn()) {
        console.log("Not logged in, showing login modal");
        LoginManager.showLoginModal();
        return;
    }
    else
        console.log("Logged in, showing store");
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
                <button 
                    class="${inLibrary ? 'owned-button' : 'buybutton'}" 
                    id="${game.name}buybutton"
                    ${inLibrary ? 'disabled' : ''}
                >
                    ${inLibrary ? 'Already in library' : `Add to library ${game.price === 0 ? 'Free' : `${game.price}$`}`}
                </button>
            </div>
        `;
        storeContainer.innerHTML += gamesHTML;
    });
    setupBuyButtons();
}
function setupBuyButtons() {
    const buyButtons = document.querySelectorAll('.buybutton');
    buyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            var _a;
            const gameCard = e.target.closest('.gamecard');
            if (!gameCard)
                return;
            const gameId = (_a = gameList.find(g => g.name + 'card' === gameCard.id)) === null || _a === void 0 ? void 0 : _a.id;
            if (gameId === undefined)
                return;
            // Ajoute le jeu à la bibliothèque
            UserLibraryManager.addGame(gameId);
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
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
document.addEventListener('DOMContentLoaded', setupStore);
