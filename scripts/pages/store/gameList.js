var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LoginManager } from "../../managers/loginManager.js";
import { GameManager } from "../../managers/gameManager.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
export function setupGameList() {
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
        const gameList = yield GameManager.getGameList();
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
    });
}
