import { fetchUsernames, showProfileCard } from "../community/peopleList.js"; // Import de showProfileCard
import { GameManager } from "../../managers/gameManager.js";
import { setupLibrary } from "./library.js";
import api from "../../helpers/api.js"; // Import de l'API helper
import { launchPong } from "../../games/pong/main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
import { launchSpaceInvader } from "../../games/spaceInvader/main.js";
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
    const currentUser = await GameManager.getCurrentUser();
    // Récupérer les rankings depuis l'API
    const rankingsResponse = await api.get(`/api/games/${game.id}/rankings`);
    const rankings = await rankingsResponse.json();
    // Associer les rankings aux utilisateurs
    const rankedPeople = await Promise.all(rankings.map(async (ranking) => {
        const person = people.find((p) => p.id === ranking.userId);
        return Object.assign(Object.assign({}, person), { wins: ranking.win, losses: ranking.loss });
    }));
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
          <div class="rankingSection">
            <h3 class="sectionTitle">Online 1vs1 Ranking</h3>
            <div class="rankingContainer">
              <ul class="rankingList">
                ${rankedPeople.map((person, index) => `
                  <li class="rankingItem" id="user-${person.username}">
                    <span class="numberRank">${index + 1}</span> <!-- Numéro de classement -->
                    <img src="${person.profile_picture || 'default-profile.png'}" class="profilePic" alt="${person.username}">
                    <span class="playerName" data-username="${person.username}" data-profile-picture="${person.profile_picture}" data-email="${person.email}" data-bio="${person.bio}">
                      ${person.username}
                    </span>
                    ${index === 0 ? '<span class="medal">🥇</span>' : ''}
                    ${index === 1 ? '<span class="medal">🥈</span>' : ''}
                    ${index === 2 ? '<span class="medal">🥉</span>' : ''}
                    <span class="playerWins">Wins: ${person.wins}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            <button id="scrollToCurrentUser" class="scrollButton">Go to My Rank</button>
          </div>
          <div class="friendsSection">
            <h3 class="sectionTitle">Friend List</h3>
            <div class="friendsContainer">
              <ul class="friendsList">
                ${people.map((person) => `
                  <li class="friendItem">
                    <img src="${person.profile_picture || 'default-profile.png'}" class=" ${person.isOnline ? 'profilePicOnline' : 'profilePic'}" alt="${person.username}">
                    <span class="friendName" data-username="${person.username}" data-profile-picture="${person.profile_picture}" data-email="${person.email}" data-bio="${person.bio}">
                      ${person.username}
                    </span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    // Ajouter un événement de clic sur chaque nom pour afficher la carte de profil
    const friendNames = details.querySelectorAll('.friendName');
    friendNames.forEach(friendName => {
        friendName.addEventListener('click', () => {
            var _a;
            const username = friendName.getAttribute('data-username');
            const profilePicture = friendName.getAttribute('data-profile-picture') || 'default-profile.png';
            const email = friendName.getAttribute('data-email');
            const bio = friendName.getAttribute('data-bio') || 'No bio available';
            const userId = ((_a = people.find(person => person.username === username)) === null || _a === void 0 ? void 0 : _a.id) || 0;
            showProfileCard(username, profilePicture, email, bio, userId);
        });
    });
    // Bouton de fermeture
    const closeBtn = details.querySelector('.close-button');
    closeBtn.addEventListener('click', () => {
        setupLibrary();
    });
    // Bouton PLAY
    const playBtn = details.querySelector('#launchGameButton');
    playBtn.addEventListener('click', () => {
        switch (game.name) {
            case 'Pong':
                launchPong();
                break;
            case 'Space Defense':
                launchSpaceInvader();
                break;
            case 'TicTacToe':
                showErrorNotification("This game is not available yet");
                break;
            default:
                showErrorNotification("This game is not available yet");
                break;
        }
    });
    // Bouton Go to My Rank
    const scrollToCurrentUserBtn = details.querySelector('#scrollToCurrentUser');
    scrollToCurrentUserBtn.addEventListener('click', () => {
        if (!currentUser || !currentUser.username)
            return;
        // Trouver l'élément correspondant à l'utilisateur en cours
        const userElement = details.querySelector(`#user-${currentUser.username}`);
        if (userElement) {
            userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            userElement.style.backgroundColor = '#4a5568'; // Mettre en surbrillance temporaire
            setTimeout(() => {
                userElement.style.backgroundColor = ''; // Retirer la surbrillance après 2 secondes
            }, 2000);
        }
    });
}
