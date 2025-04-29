import { fetchUsernames, showProfileCard } from "../community/peopleList.js"; // Import de showProfileCard
import { gameModalHTML } from "../../sourcepage.js";
import { displayMenu } from '../../games/pong/DisplayMenu.js';
import { GameManager } from "../../managers/gameManager.js";
import { setupLibrary } from "./library.js";
import { HOSTNAME } from "../../main.js"; // Assurez-vous que HOSTNAME est correctement importé
// Nouvelle fonction pour récupérer le classement des joueurs
async function fetchLeaderboard(gameId) {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/leaderboard/${gameId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.leaderboard) {
            return data.leaderboard;
        }
        else {
            console.error('Failed to fetch leaderboard:', data.error);
            return [];
        }
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}
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
    // Récupérer les user_ids du jeu
    const userIds = JSON.parse(game.user_ids || '[]'); // Parse user_ids de la table games
    // Filtrer la liste pour exclure l'utilisateur en cours et vérifier s'ils possèdent le jeu
    const filteredPeople = people.filter(person => {
        const personId = person.id; // Temporarily cast to any if id is missing in type
        return person.username !== currentUser.username && userIds.includes(personId);
    });
    // Récupérer le classement des joueurs pour ce jeu
    const leaderboard = await fetchLeaderboard(game.id);
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
            ${leaderboard.map((entry, index) => {
        const player = people.find(person => person.id === entry.user_id);
        return `
                  <li class="rankingItem">
                    <span class="numberRank">${index + 1}</span>
                    <img src="${(player === null || player === void 0 ? void 0 : player.profile_picture) || '/assets/default-profile.png'}" class="profilePic" alt="Profile">
                    <div class="playerInfo">
                      <span class="playerName">${(player === null || player === void 0 ? void 0 : player.username) || 'Unknown'}</span>
                      <span class="playerWins">Wins: ${entry.victories}</span>
                    </div>
                  </li>
                `;
    }).join('')}
          </ul>
        </div>
        <div class="friendsContainer">
          <h3 class="sectionTitle">People List</h3>
          <ul class="friendsList">
            ${filteredPeople.map(person => `
              <li class="friendItem">
                <img src="${person.profile_picture || 'default-profile.png'}" class="profilePic" alt="${person.username}">
                <span class="friendName" data-username="${person.username}" data-profile-picture="${person.profile_picture}" data-email="${person.email}" data-bio="${person.bio}">
                  ${person.username}
                </span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
    // Ajouter un événement de clic sur chaque nom pour afficher la carte de profil
    const friendNames = details.querySelectorAll('.friendName');
    friendNames.forEach(friendName => {
        friendName.addEventListener('click', () => {
            const username = friendName.getAttribute('data-username');
            const profilePicture = friendName.getAttribute('data-profile-picture') || 'default-profile.png';
            const email = friendName.getAttribute('data-email');
            const bio = friendName.getAttribute('data-bio') || 'No bio available';
            showProfileCard(username, profilePicture, email, bio);
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
        const modal = document.getElementById('optionnalModal');
        if (!modal)
            return;
        modal.innerHTML = gameModalHTML;
        displayMenu();
    });
}
