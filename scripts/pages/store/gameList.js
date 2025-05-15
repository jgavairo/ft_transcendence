import { LoginManager } from "../../managers/loginManager.js";
import { GameManager } from "../../managers/gameManager.js";
import { setupCard } from "./buybuttons.js";
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
        const gamesHTML = `
                <div class="gamecard" id="${game.name}card">
                    <img src="${game.image}" alt="${game.name}-logo" class="gamecard-img">
                    <div class="gamecard-details">
                        <h2>${game.name}</h2>
                        <p>${game.description}</p>
                    </div>
                </div>
            `;
        storeContainer.innerHTML += gamesHTML;
    }));
    // setupBuyButtons();
    setupCard();
}
