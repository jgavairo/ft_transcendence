import { gameList } from "./gameStoreList.js";
import { UserLibraryManager } from "./userLibrary.js";
import { LoginManager } from "./loginModal.js";

export async function setupStore() 
{
    const storeContainer = document.querySelector('.gamescontainer');

    if (!storeContainer) {
        console.error('Store container not found');
        return;
    }
    if(!await LoginManager.isLoggedIn())
    {
        console.log("Not logged in, showing login modal");
        LoginManager.showLoginModal();
        return;
    }
    else 
        console.log("Logged in, showing store");

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

function setupBuyButtons() 
{
    const buyButtons = document.querySelectorAll('.buybutton');
    buyButtons.forEach(async (button) => {
        button.addEventListener('click', async (e) => {
            const gameCard = (e.target as HTMLElement).closest('.gamecard');
            if (!gameCard) return;
            
            const gameId = gameList.find(g => g.name + 'card' === gameCard.id)?.id;
            if (gameId === undefined) return;
            
            // Ajoute le jeu à la bibliothèque
            await UserLibraryManager.addGame(gameId);
            console.log("IN SETUP BUY BUTTON CLICKED");

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
