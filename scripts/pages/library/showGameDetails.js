import { fetchUsernames, showProfileCard } from "../community/peopleList.js"; // Import de showProfileCard
import { gameModalHTML } from "../../sourcepage.js";
import { displayMenu } from '../../games/pong/DisplayMenu.js';
import { GameManager } from "../../managers/gameManager.js";
import { setupLibrary } from "./library.js";
import api from "../../helpers/api.js"; // Import de l'API helper
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
    const rankedPeople = rankings.map((ranking) => {
        const person = people.find((p) => p.id === ranking.userId);
        return Object.assign(Object.assign({}, person), { ranking: ranking.ranking });
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
          <div class="rankingSection">
            <h3 class="sectionTitle">Online 1vs1 Ranking</h3>
            <div class="rankingContainer">
              <ul class="rankingList">
                ${rankedPeople.map((person) => `
                  <li class="rankingItem">
                    <img src="${person.profile_picture || 'default-profile.png'}" class="profilePic" alt="${person.username}">
                    <span class="playerName" data-username="${person.username}" data-profile-picture="${person.profile_picture}" data-email="${person.email}" data-bio="${person.bio}">
                      ${person.username} - Wins: ${person.ranking}
                    </span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
          <div class="friendsSection">
            <h3 class="sectionTitle">Friend List</h3>
            <div class="friendsContainer">
              <ul class="friendsList">
                ${people.map(person => `
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
