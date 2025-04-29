import { fetchUsernames } from "../community/peopleList.js";
import { gameModalHTML } from "../../sourcepage.js";
import { displayMenu } from '../../games/pong/DisplayMenu.js';
import { GameManager } from "../../managers/gameManager.js";
import { setupLibrary } from "./library.js";
export async function showGameDetails(gameIdOrObj) {
    // Récupérer l'objet game complet
    let game;
    if (typeof gameIdOrObj === 'number') {
        const allGames = await GameManager.getGameList();
        game = allGames.find(g => g.id === gameIdOrObj);
    }
    else {
        game = gameIdOrObj;
    }
    if (!game)
        return;
    // Récupérer les utilisateurs
    const people = await fetchUsernames();
    // Récupérer l'utilisateur en cours
    const currentUser = await GameManager.getCurrentUser(); // Assurez-vous que cette méthode existe
    // Récupérer les user_ids du jeu
    const userIds = JSON.parse(game.user_ids || '[]'); // Parse user_ids de la table games
    // Filtrer la liste pour exclure l'utilisateur en cours et vérifier s'ils possèdent le jeu
    const filteredPeople = people.filter(person => {
        const personId = person.id; // Temporarily cast to any if id is missing in type
        return person.username !== currentUser.username && userIds.includes(personId);
    });
    const details = document.querySelector('.library-details');
    if (!details)
        return;
    details.innerHTML = `
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
              <span class="numberRank">1</span>
              <img src="/assets/pp.png" class="profilePic" alt="Profile">
              <div class="playerInfo">
                <span class="playerName">Jordan</span>
                <span class="playerWins">Wins: 10</span>
              </div>
            </li>
          </ul>
        </div>
        <div class="friendsContainer">
          <h3 class="sectionTitle">People List</h3>
          <ul class="friendsList">
            ${filteredPeople.map(person => `
              <li class="friendItem">
                <img src="${person.profile_picture || 'default-profile.png'}" class="profilePic" alt="${person.username}">
                <span class="friendName">${person.username}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
    // Bouton de fermeture
    const closeBtn = details.querySelector('.close-button');
    closeBtn.addEventListener('click', () => {
        setupLibrary();
    });
    // Bouton PLAY
    const playBtn = details.querySelector('#launchGameButton');
    playBtn.addEventListener('click', () => {
        const modal = document.getElementById('optionnalModal');
        if (!modal)
            return;
        modal.innerHTML = gameModalHTML;
        displayMenu();
    });
}
