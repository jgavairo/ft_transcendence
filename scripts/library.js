import { gameList } from "./gameStoreList.js";
import { UserLibraryManager } from "./userLibrary.js";
export function setupLibrary() {
    const libraryList = document.querySelector('.library-games-list');
    const detailsContainer = document.querySelector('.library-details');
    if (!libraryList || !detailsContainer) {
        console.error('Library containers not found');
        return;
    }
    const libraryGameIds = UserLibraryManager.getLibraryGames();
    if (libraryGameIds.length === 0) {
        libraryList.innerHTML = `<p class="text-white">Your library is empty.</p>`;
        return;
    }
    libraryGameIds.forEach((id) => {
        const game = gameList.find(g => g.id === id);
        if (!game)
            return;
        const li = document.createElement('li');
        li.className = 'gamesidelist cursor-pointer text-white flex items-center mb-2';
        li.innerHTML = `<img src="${game.image}" alt="${game.name}" class="w-4 h-4 mr-2"> ${game.name}`;
        li.addEventListener('click', () => {
            showGameDetails(game);
        });
        libraryList.appendChild(li);
    });
    const gamesHTML = libraryGameIds.map((id) => {
        const game = gameList.find(g => g.id === id);
        if (!game)
            return "";
        return `
      <div class="flex flex-col items-center">
         <img src="${game.image}" alt="${game.name}" class="w-60 h-60 object-cover rounded">
         <p class="text-white mt-2">${game.name}</p>
      </div>
    `;
    }).join("");
    detailsContainer.innerHTML = `
      <div class="library-details">
      <div class="flex items-center mb-4">
        <h2 class="mt-2 text-xl font-bold text-[#8F8F8F]">All games (${libraryGameIds.length})</h2>
        <div class="mt-2 flex-1 border-t border-gray-500 ml-4"></div>
      </div>
      </div>
      <div class="flex flex-wrap gap-4">
         ${gamesHTML}
      </div>
  `;
}
function showGameDetails(game) {
    const detailsContainer = document.querySelector('.library-details');
    if (!detailsContainer)
        return;
    detailsContainer.innerHTML = `
    <section>
      <div class="relative">
        <img src="${game.image}" alt="${game.name}" class="w-full h-[350px]">
        <div class="bannerGameSelect">
          <button class="text-white bg-[#195887] hover:bg-blue-500 px-4 py-2 rounded w-[150px] h-[70px]">
            PLAY
          </button>
        </div>
      </div>
    </section>
  `;
}
document.addEventListener('DOMContentLoaded', setupLibrary);
