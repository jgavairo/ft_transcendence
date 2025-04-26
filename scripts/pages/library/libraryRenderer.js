import { GameManager } from "../../managers/gameManager.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { showGameDetails } from "./showGameDetails.js";
/**
 * Affiche la liste des jeux dans la sidebar et la grille principale.
 * Lorsque l'utilisateur clique sur un item ou une carte, appelle showGameDetails.
 */
export async function renderLibrary(query) {
    // 1. Récupération des données
    const gameList = await GameManager.getGameList();
    const libraryIds = await UserLibraryManager.getLibraryGames();
    const filteredIds = libraryIds.filter(id => {
        const g = gameList.find(g => g.id === id);
        return !!g && (!query || g.name.toLowerCase().includes(query));
    });
    // 2. Mise à jour de la sidebar
    const listEl = document.querySelector('.library-games-list');
    listEl.innerHTML = filteredIds.length === 0
        ? `<p class=\"empty-message\">No games found.</p>`
        : filteredIds.map(id => {
            const g = gameList.find(g => g.id === id);
            return `
          <li class=\"gamesidelist\" data-id=\"${g.id}\" id=\"${g.name.replace(/\s+/g, '_')}line\">
            <img src=\"${g.image}\" alt=\"${g.name}\" class=\"sidebar-game-icon\"/> ${g.name}
          </li>`;
        }).join('');
    // 3. Mise à jour de la grille de vignettes
    const detailsContainer = document.querySelector('.library-details');
    if (filteredIds.length === 0) {
        detailsContainer.innerHTML = `
      <div class=\"header-section\">
        <h2 class=\"header-title\">All games (0)</h2>
        <div class=\"divider\"></div>
      </div>`;
        return;
    }
    detailsContainer.innerHTML = `
    <div class=\"header-section\">
      <h2 class=\"header-title\">All games (${filteredIds.length})</h2>
      <div class=\"divider\"></div>
    </div>
    <div class=\"library-games\">
      ${filteredIds.map(id => {
        const g = gameList.find(g => g.id === id);
        return `
          <div class=\"game-card\" data-game-id=\"${g.id}\">
            <img src=\"${g.image}\" alt=\"${g.name}\" class=\"game-image\"/>
          </div>`;
    }).join('')}
    </div>`;
    // 4. Fonction de mise en évidence de la sidebar
    function highlightSidebar(id) {
        document.querySelectorAll('.activegamesidelist').forEach(el => {
            el.classList.remove('activegamesidelist');
        });
        const g = gameList.find(g => g.id === id);
        if (!g)
            return;
        const lineEl = document.getElementById(g.name.replace(/\s+/g, '_') + 'line');
        if (lineEl)
            lineEl.classList.add('activegamesidelist');
    }
    // 5. Attachement des listeners
    listEl.querySelectorAll('.gamesidelist').forEach(item => {
        item.addEventListener('click', () => {
            const id = Number(item.getAttribute('data-id'));
            highlightSidebar(id);
            showGameDetails(id);
        });
    });
    detailsContainer.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = Number(card.getAttribute('data-game-id'));
            highlightSidebar(id);
            showGameDetails(id);
        });
    });
}
