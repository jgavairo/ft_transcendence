import { LoginManager } from "../../managers/loginManager.js";
import { GameManager } from "../../managers/gameManager.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { setupBuyButtons, setupCard } from "./buybuttons.js";

export async function setupGameList()
{
    const storeContainer = document.querySelector('.gamescontainer');

    if (!storeContainer) 
    {
        console.error('Store container not found');
        return;
    }
    if(!await LoginManager.isLoggedIn())
    {
        LoginManager.showLoginModal();
        return;
    }
        const gameList = await GameManager.getGameList();
        await Promise.all(gameList.map(async (game) => 
        {
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
        setupCard();
}