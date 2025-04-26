import { LoginManager } from "../../managers/loginManager.js";
import { GameManager } from "../../managers/gameManager.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { setupBuyButtons } from "./buybuttons.js";
export async function setupGameList() {
    const storeContainer = document.querySelector('.gamescontainer');
    if (!storeContainer) {
        console.error('Store container not found');
        return;
    }
    if (!await LoginManager.isLoggedIn()) {
        console.log("Not logged in, showing login modal");
        LoginManager.showLoginModal();
        return;
    }
    else
        console.log("Logged in, showing store");
    const gameList = await GameManager.getGameList();
    await Promise.all(gameList.map(async (game) => {
        console.log("Game id:", game.id);
        const inLibrary = await UserLibraryManager.hasGame(game.id);
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
    }));
    setupBuyButtons();
}
