import { gameList } from "./gameStoreList.js";
import { UserLibraryManager } from "./userLibrary.js";
import { gameModalHTML } from "../scripts/sourcepage.js"
import { displayMenu, startPong } from './games/pong/pongGame.js';

let activedinlist = false;

export async function setupLibrary(): Promise<void> {
  const libraryList = document.querySelector('.library-games-list') as HTMLElement;
  const detailsContainer = document.querySelector('.library-details') as HTMLElement;
  if (!libraryList || !detailsContainer) {
    console.error('Library containers not found');
    return;
  }
  
  let searchBar = document.getElementById("searchBar") as HTMLInputElement;

  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    renderLibrary(query);
  });

  renderLibrary("");
}

async function renderLibrary(query: string): Promise<void> {
  const libraryList = document.querySelector('.library-games-list') as HTMLElement;
  const detailsContainer = document.querySelector('.library-details') as HTMLElement;
  if (!libraryList || !detailsContainer) return;

  const libraryGameIds: number[] = await UserLibraryManager.getLibraryGames();

  let filteredIds: number[] = libraryGameIds;
  if(query) {
    filteredIds = libraryGameIds.filter((id: number) => {
      const game = gameList.find(g => g.id === id);
      if (!game) return false;
      return game.name.toLowerCase().includes(query);
    });
  }

  libraryList.innerHTML = "";
  if (filteredIds.length === 0) {
    libraryList.innerHTML = `<p class="empty-message">No games found.</p>`;
    detailsContainer.innerHTML = `
      <div class="header-section">
        <h2 class="header-title">All games (0)</h2>
        <div class="divider"></div>
      </div>
    `;
    return;
  }

  filteredIds.forEach((id: number) => {
    const game = gameList.find(g => g.id === id);
    if (!game) return;
    const li = document.createElement('li');
    li.className = 'gamesidelist';
    li.id = `${game.name.replace(/\s+/g, '_')}line`;
    li.innerHTML = `<img src="${game.image}" alt="${game.name}" class="sidebar-game-icon"> ${game.name}`;
    li.addEventListener('click', () => {
      showGameDetails(game);
      const actived = document.getElementsByClassName('activegamesidelist');
      for (let i = 0; i < actived.length; i++) {
        (actived[i] as HTMLElement).classList.remove('activegamesidelist');
      }
      li.classList.add('activegamesidelist');
    });
    libraryList.appendChild(li);
  });

  let gamesHTML = "";
  filteredIds.forEach((id: number) => {
    const game = gameList.find(g => g.id === id);
    if (!game) return;
    gamesHTML += `
      <div class="game-card" data-game-id="${game.id}">
        <img src="${game.image}" alt="${game.name}" class="game-image">
      </div>
    `;
  });
  detailsContainer.innerHTML = `
    <div class="header-section">
      <h2 class="header-title">All games (${filteredIds.length})</h2>
      <div class="divider"></div>
    </div>
    <div class="library-games">${gamesHTML}</div>
  `;

  const gameCards = detailsContainer.querySelectorAll('.game-card');
  gameCards.forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.getAttribute('data-game-id');
      const game = gameList.find(g => g.id === Number(gameId));
      if (game) {
        showGameDetails(game);
        const actived = document.getElementsByClassName('activegamesidelist');
        for (let i = 0; i < actived.length; i++) {
          (actived[i] as HTMLElement).classList.remove('activegamesidelist');
        }
        const gameline = document.getElementById(`${game.name.replace(/\s+/g, '_')}line`);
        if (gameline) {
          gameline.classList.add('activegamesidelist');
        }
      }
    });
  });
}

function showGameDetails(game: any): void {
  const detailsContainer = document.querySelector('.library-details') as HTMLElement;
  if (!detailsContainer) return;

  detailsContainer.innerHTML = `
    <div class="detail-container">
      <div class="detail-image">
        <button class="close-button">&times;</button>
        <img src="${game.image}" alt="${game.name}">
        <div class="bannerGameSelect">
          <button id="launchGameButton" class="playButton">PLAY</button>
        </div>
      </div>
      <div class="detail-info">
        <div class="rankingContainer">
          <h3 class="sectionTitle">Player Ranking</h3>
          <ul class="rankingList">
            <li class="rankingItem">
              <span class="numberRank"> 1 </span>
              <img src="/assets/pp.png" class="profilePic">
              <div class="playerInfo">
                <span class="playerName">Jordan</span>
                <span class="playerWins">Wins: 10</span>
              </div>
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
    </div>
  `;
  const closeButton = detailsContainer.querySelector('.close-button') as HTMLButtonElement;
  closeButton.addEventListener('click', () => {
    setupLibrary();
  });

  const playButton = document.getElementById('launchGameButton');
  if (!playButton) return;
  playButton.addEventListener('click', () => {
    const target = document.getElementById('optionnalModal');
    if (!target) return;
    target.innerHTML = gameModalHTML;
    displayMenu();
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const target = document.getElementById('optionnalModal');
        if (target) {
          target.innerHTML = '';
        }
      }
    });
  });
}
