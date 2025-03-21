import { gameList } from "./gameStoreList.js";
export function setupStore() {
    const storeContainer = document.querySelector('.gamescontainer');
    if (!storeContainer) {
        console.error('Store container not found');
        return;
    }
    gameList.forEach(game => {
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
                <button class="buybutton" id="${game.name}buybutton">
                    Add to library
                </button>
            </div>
            `;
        storeContainer.innerHTML += gamesHTML;
    });
}
document.addEventListener('DOMContentLoaded', setupStore);
