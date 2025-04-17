var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { gameList } from "./gameStoreList.js";
import { UserLibraryManager } from "./userLibrary.js";
import { LoginManager } from "./loginModal.js";
export function setupStore() {
    return __awaiter(this, void 0, void 0, function* () {
        const storeContainer = document.querySelector('.gamescontainer');
        if (!storeContainer) {
            console.error('Store container not found');
            return;
        }
        if (!(yield LoginManager.isLoggedIn())) {
            console.log("Not logged in, showing login modal");
            LoginManager.showLoginModal();
            return;
        }
        else
            console.log("Logged in, showing store");
        yield Promise.all(gameList.map((game) => __awaiter(this, void 0, void 0, function* () {
            console.log("Game id:", game.id);
            const inLibrary = yield UserLibraryManager.hasGame(game.id);
            console.log("Game in library:", inLibrary);
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
        })));
        setupBuyButtons();
    });
}
function setupBuyButtons() {
    const buyButtons = document.querySelectorAll('.buybutton');
    buyButtons.forEach((button) => __awaiter(this, void 0, void 0, function* () {
        button.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const gameCard = e.target.closest('.gamecard');
            if (!gameCard)
                return;
            const gameId = (_a = gameList.find(g => g.name + 'card' === gameCard.id)) === null || _a === void 0 ? void 0 : _a.id;
            if (gameId === undefined)
                return;
            // Ajoute le jeu à la bibliothèque
            yield UserLibraryManager.addGame(gameId);
            console.log("IN SETUP BUY BUTTON CLICKED");
            // Met à jour l'apparence du bouton
            const button = e.target;
            button.textContent = 'Already in library';
            button.classList.replace('buybutton', 'owned-button');
            button.disabled = true;
            // Affiche une notification
            showNotification('Game added to your library!');
        }));
    }));
}
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
document.addEventListener('DOMContentLoaded', setupStore);
