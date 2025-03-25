import { gameList } from "./gameStoreList.js";
import { UserLibraryManager } from "./userLibrary.js";
export function setupLibrary() {
    const libraryList = document.querySelector('.library-games-list');
    const detailsContainer = document.querySelector('.library-details');
    if (!libraryList || !detailsContainer) {
        console.error('Library containers not found');
        return;
    }
    libraryList.innerHTML = '';
    const libraryGameIds = UserLibraryManager.getLibraryGames();
    if (libraryGameIds.length === 0) {
        libraryList.innerHTML = `<p class="text-white">Your library is empty.</p>`;
        detailsContainer.innerHTML = `
      <div class="flex items-center mb-4">
         <h2 class="mt-2 text-xl font-bold text-[#8F8F8F]">All games (0)</h2>
         <div class="mt-2 flex-1 border-t border-gray-500 ml-4"></div>
      </div>
    `;
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
    let gamesHTML = "";
    libraryGameIds.forEach((id) => {
        const game = gameList.find(g => g.id === id);
        if (!game)
            return;
        gamesHTML += `
      <div class="game-card flex flex-col items-center ml-4" data-game-id="${game.id}">
         <img src="${game.image}" alt="${game.name}" class="w-60 h-60 object-cover rounded">
         <p class="text-white mt-2">${game.name}</p>
      </div>
    `;
    });
    detailsContainer.innerHTML = `
      <div class="library-details">
      <div class="flex items-center mb-4">
        <h2 class="mt-2 text-xl font-bold text-[#8F8F8F] ml-6 mb-6">All games (${libraryGameIds.length})</h2>
        <div class="mt-2 flex-1 border-t border-gray-500 ml-6 mb-6"></div>
      </div>
      </div>
      `;
    detailsContainer.innerHTML += `<div class="flex flex-row flex-wrap gap-4">${gamesHTML}</div>`;
    const gameCards = detailsContainer.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game-id');
            console.log("Game clicked:", gameId);
            const game = gameList.find(g => g.id === Number(gameId));
            showGameDetails(game);
        });
    });
}
function showGameDetails(game) {
    const detailsContainer = document.querySelector('.library-details');
    if (!detailsContainer)
        return;
    detailsContainer.innerHTML = `
    <div class="relative w-full rounded overflow-hidden">
      <img src="${game.image}" alt="${game.name}" class="imgGameSelect">
      <div class="bannerGameSelect">
        <button class="playButton">
          PLAY
        </button>
      </div>
    </div>

    <div class="containerGameSelect">
      <div class="rankingContainer">
        <h3 class="sectionTitle">Player Ranking</h3>
        <ul class="rankingList">
          <li class="rankingItem">
            
            <img src="/assets/pp.png" class="profilePic">
            <div class="playerInfo">
              <span class="playerName">Jordan</span>
              <span class="playerWins">Wins: 10</span>
            </div>
          </li>
          </li>
        </ul>
      </div>
      
      <div class="friendsContainer">
        <h3 class="sectionTitle">Friends Online</h3>
        <ul class="friendsList">
          <li class="friendItem">
            <img src="/assets/pp.png" class="profilePic">
            <span class="friendName">LPR</span>
          </li>
          <li class="friendItem">
            <img src="/assets/pp.png" class="profilePic">
            <span class="friendName">Francis</span>
          </li>
        </ul>
      </div>
    </div>
  `;
}
document.addEventListener('DOMContentLoaded', setupLibrary);
