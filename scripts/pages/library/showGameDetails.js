import { fetchUsernames, showProfileCard } from "../community/peopleList.js"; // Import showProfileCard
import { GameManager } from "../../managers/gameManager.js";
import { setupLibrary } from "./library.js";
import api from "../../helpers/api.js"; // Import de l'API helper
import { launchPong } from "../../games/pong/main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
import { startTowerGame } from "../../games/tower/index.js";
/**
 * Renders the HTML to display the player ranking for a specific game
 * @param gameId - The ID of the game for which to display the ranking
 * @param container - The HTML element in which to insert the ranking
 * @param currentUser - The currently logged-in user
 */
export async function renderRankings(gameId, container, currentUser) {
    // Retrieve users
    const people = await fetchUsernames();
    // Retrieve rankings from the API
    const rankingsResponse = await api.get(`/api/games/${gameId}/rankings`);
    const rankings = await rankingsResponse.json();
    // Associate rankings with users
    const rankedPeople = await Promise.all(rankings.map(async (ranking) => {
        const person = people.find((p) => p.id === ranking.userId);
        return Object.assign(Object.assign({}, person), { wins: ranking.win, losses: ranking.loss });
    }));
    // Simple function to add a timestamp to image URLs
    const getImageUrl = (imagePath, username) => {
        if (!imagePath || imagePath === 'default-profile.png') {
            return 'default-profile.png';
        }
        // Add a timestamp to force reload
        const timestamp = Date.now();
        return `${imagePath}?v=${timestamp}&user=${username}`;
    };
    container.innerHTML = `
        <div class="rankingSection">
            <h3 class="sectionTitle">Online 1vs1 Ranking</h3>
            <div class="rankingContainer">
                <ul class="rankingList">
                    ${rankedPeople.map((person, index) => `
                        <li class="rankingItem" id="user-${person.username}">
                            <span class="numberRank">${index + 1}</span> <!-- Numéro de classement -->
                            <img src="${getImageUrl(person.profile_picture, person.username)}" class="profilePic" alt="${person.username}">
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
    `;
    // Add a click event to each name to display the profile card
    const playerNames = container.querySelectorAll('.playerName');
    playerNames.forEach(playerName => {
        playerName.addEventListener('click', () => {
            var _a;
            const username = playerName.getAttribute('data-username');
            const profilePicture = playerName.getAttribute('data-profile-picture') || 'default-profile.png';
            const bio = playerName.getAttribute('data-bio') || 'No bio available';
            const userId = ((_a = people.find(person => person.username === username)) === null || _a === void 0 ? void 0 : _a.id) || 0;
            showProfileCard(username, getImageUrl(profilePicture, username), bio, userId);
        });
    });
    // "Go to My Rank" button
    const scrollToCurrentUserBtn = container.querySelector('#scrollToCurrentUser');
    if (scrollToCurrentUserBtn && currentUser && currentUser.username) {
        scrollToCurrentUserBtn.addEventListener('click', () => {
            // Find the element corresponding to the current user
            const userElement = container.querySelector(`#user-${currentUser.username}`);
            if (userElement) {
                userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                userElement.style.backgroundColor = '#4a5568'; // Highlight temporarily
                setTimeout(() => {
                    userElement.style.backgroundColor = ''; // Remove highlight after 2 seconds
                }, 2000);
            }
        });
    }
    return rankedPeople;
}
/**
 * Generates the HTML for the friend list for the game library
 * @param people - List of users
 * @returns string - HTML for the friend list
 */
export function renderFriendList(people) {
    // Simple function to add a timestamp to image URLs
    const getImageUrl = (imagePath, username) => {
        if (!imagePath || imagePath === 'default-profile.png') {
            return 'default-profile.png';
        }
        // Add a timestamp to force reload
        const timestamp = Date.now();
        return `${imagePath}?v=${timestamp}&user=${username}`;
    };
    if (!people || people.length === 0) {
        return `
            <div class="friendsSection">
                <h3 class="sectionTitle">Friend List</h3>
                <div class="friendsContainer nobodyToShow">
                    <span class="nobodyToShowMsg">Please tell them this game is awesome...</span>
                </div>
            </div>
        `;
    }
    return `
        <div class="friendsSection">
            <h3 class="sectionTitle">Friend List</h3>
            <div class="friendsContainer">
                <ul class="friendsList">
                    ${people.map((person) => `
                        <li class="friendItem">
                            <img src="${getImageUrl(person.profile_picture, person.username)}" class="${person.isOnline ? 'profilePicOnline' : 'profilePic'}" alt="${person.username}">
                            <span class="friendName" data-username="${person.username}" data-profile-picture="${person.profile_picture}" data-email="${person.email}" data-bio="${person.bio}">
                                ${person.username}
                            </span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}
export async function showGameDetails(gameIdOrObj) {
    // Function to add a timestamp to image URLs
    const getImageUrl = (imagePath, username) => {
        if (!imagePath || imagePath === 'default-profile.png') {
            return 'default-profile.png';
        }
        // Add a timestamp to force reload
        const timestamp = Date.now();
        return `${imagePath}?v=${timestamp}&user=${username}`;
    };
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
    const people = await fetchUsernames();
    const currentUser = await GameManager.getCurrentUser();
    let userIds = [];
    try {
        userIds = JSON.parse(game.user_ids || '[]');
    }
    catch (_a) {
        userIds = [];
    }
    let friendIds = [];
    try {
        const res = await api.get('/api/friends/allFriendIds');
        const data = await res.json();
        if (data.success && Array.isArray(data.ids)) {
            friendIds = data.ids;
        }
    }
    catch (e) {
        friendIds = [];
    }
    // Filter the friend list to show only users who own the game, are not the current user, and are friends
    const filteredPeople = people.filter(person => userIds.includes(person.id) && person.id !== currentUser.id && friendIds.includes(person.id));
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
          <div id="rankings-container"></div>
          ${renderFriendList(filteredPeople)}
        </div>
      </div>
    `;
    const rankingsContainer = details.querySelector('#rankings-container');
    await renderRankings(game.id, rankingsContainer, currentUser);
    const friendNames = details.querySelectorAll('.friendName');
    friendNames.forEach(friendName => {
        friendName.addEventListener('click', () => {
            var _a;
            const username = friendName.getAttribute('data-username');
            const profilePicture = friendName.getAttribute('data-profile-picture') || 'default-profile.png';
            const bio = friendName.getAttribute('data-bio') || 'No bio available';
            const userId = ((_a = people.find(person => person.username === username)) === null || _a === void 0 ? void 0 : _a.id) || 0;
            showProfileCard(username, getImageUrl(profilePicture, username), bio, userId);
        });
    });
    const closeBtn = details.querySelector('.close-button');
    closeBtn.addEventListener('click', () => {
        setupLibrary();
    });
    const playBtn = details.querySelector('#launchGameButton');
    playBtn.addEventListener('click', () => {
        switch (game.name) {
            case 'Pong':
                launchPong();
                break;
            case 'Tower':
                startTowerGame();
                break;
            default:
                showErrorNotification("This game is not available yet");
                break;
        }
    });
}
export { fetchUsernames };
