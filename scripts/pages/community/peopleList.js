import { showErrorNotification, showNotification } from "../../helpers/notifications.js";
import { FriendsManager } from "../../managers/friendsManager.js";
import api from "../../helpers/api.js";
const STORAGE_KEY = "people";
const HOSTNAME = window.location.hostname;
export async function fetchUsernames() {
    try {
        const response = await api.get(`https://${HOSTNAME}:8443/api/users`);
        const data = await response.json();
        if (data.success) {
            const users = data.users.map(async (user) => (Object.assign(Object.assign({}, user), { isOnline: await FriendsManager.isOnline(user.username) })));
            return Promise.all(users);
        }
        else {
            console.error('Failed to fetch usernames:', data.message);
            return [];
        }
    }
    catch (error) {
        console.error('Error fetching usernames:', error);
        return [];
    }
}
export async function renderPeopleList(filter = "") {
    var _a;
    // Fonction pour ajouter un timestamp aux URLs d'images
    const getImageUrl = (imagePath, username) => {
        if (!imagePath || imagePath === 'default-profile.png') {
            return 'default-profile.png';
        }
        // Ajouter un timestamp pour forcer le rechargement
        const timestamp = Date.now();
        return `${imagePath}?v=${timestamp}&user=${username}`;
    };
    const communityButton = document.getElementById('communitybutton');
    if (!(communityButton === null || communityButton === void 0 ? void 0 : communityButton.classList.contains('activebutton'))) {
        return;
    }
    const container = document.getElementById("friendList");
    if (!container) {
        console.error("❌ #friendList not found");
        return;
    }
    try {
        const people = await fetchUsernames();
        const response = await fetch(`https://${HOSTNAME}:8443/api/user/infos`, {
            credentials: 'include'
        });
        const currentUser = await response.json();
        const currentUsername = (_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.user) === null || _a === void 0 ? void 0 : _a.username;
        const filtered = people.filter(person => person.username.toLowerCase().includes(filter.toLowerCase()) &&
            person.username !== currentUsername);
        // Clean the container (removes all event listeners)
        container.innerHTML = "";
        // Render all items at once
        await Promise.all(filtered.map(async (person) => {
            const isFriend = await FriendsManager.isFriend(person.username);
            let isRequesting = false;
            let isRequested = false;
            if (!isFriend) {
                isRequesting = await FriendsManager.isRequesting(person.username);
                if (!isRequesting) {
                    isRequested = await FriendsManager.isRequested(person.username);
                }
            }
            const div = document.createElement("div");
            div.className = "friend-item";
            // Make the whole item clickable
            div.addEventListener("click", () => {
                showProfileCard(person.username, person.profile_picture, person.bio, person.id);
            });
            // Container for profile image
            const profileContainer = document.createElement("div");
            profileContainer.className = "profile-picture-container";
            // Add profile image
            const img = document.createElement("img");
            const isOnline = await FriendsManager.isOnline(person.username);
            img.className = "profile-picture";
            img.src = getImageUrl(person.profile_picture, person.username);
            img.alt = `${person.username}'s profile picture`;
            // Add green circle if online
            if (isOnline) {
                const indicator = document.createElement("span");
                indicator.className = "online-indicator";
                profileContainer.appendChild(indicator);
                profileContainer.classList.add("has-online-indicator");
            }
            profileContainer.appendChild(img);
            // Remove the "view" overlay
            div.appendChild(profileContainer);
            const label = document.createElement("span");
            label.className = "friend-name";
            label.textContent = person.username;
            // Group the photo and name in a .friend-info container
            const friendInfo = document.createElement("div");
            friendInfo.className = "friend-info";
            friendInfo.appendChild(profileContainer);
            friendInfo.appendChild(label);
            div.appendChild(friendInfo);
            const button = document.createElement("button");
            const button2 = document.createElement("button");
            if (isFriend) {
                button.className = "toggle-button added";
                button.title = "Delete friend";
                button.textContent = "✖";
            }
            else if (isRequesting) {
                button.className = "toggle-button requesting";
                button.title = "Requesting - Cancel request";
                button.textContent = "⌛";
            }
            else if (isRequested) {
                button.className = "toggle-button requested";
                button.title = "Accept request";
                button.textContent = "✓";
                button2.className = "toggle-button refused";
                button2.title = "Refuse request";
                button2.textContent = "✖";
            }
            else {
                button.className = "toggle-button";
                button.title = "Add friend";
                button.textContent = "＋";
            }
            button.setAttribute("data-name", person.username);
            if (isRequested) {
                button2.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    await refuseFriendRequest(person.username);
                    await renderPeopleList();
                });
            }
            button.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (isFriend) {
                    await removeFriend(person.username);
                }
                else if (isRequesting) {
                    await cancelFriendRequest(person.username);
                }
                else if (isRequested) {
                    await acceptFriendRequest(person.username);
                }
                else {
                    await addFriend(person.username);
                }
                await renderPeopleList();
            });
            div.appendChild(button);
            div.appendChild(button2);
            container.appendChild(div);
        }));
    }
    catch (error) {
        console.error("Error in renderPeopleList:", error);
    }
}
export async function refuseFriendRequest(name) {
    const success = await FriendsManager.refuseFriendRequest(name);
    if (success) {
        showNotification("Friend request from " + name + " has been refused");
    }
    else {
        console.error('Failed to refuse friend request');
        showErrorNotification("Failed to refuse friend request");
    }
}
export async function cancelFriendRequest(name) {
    const success = await FriendsManager.cancelFriendRequest(name);
    if (success) {
        showNotification(name + " is no longer requesting to be your friend");
        return true;
    }
    else {
        console.error("Failed to cancel friend request");
        showErrorNotification("Failed to cancel friend request");
        return false;
    }
}
export async function removeFriend(name) {
    try {
        const success = await FriendsManager.removeFriend(name);
        if (success) {
            showNotification(name + " is no longer your friend");
            return true;
        }
        else {
            console.error("Failed to remove friend");
            showErrorNotification("Failed to remove friend");
            return false;
        }
    }
    catch (error) {
        console.error("Error in removeFriend:", error);
        return false;
    }
}
export async function acceptFriendRequest(name) {
    try {
        const success = await FriendsManager.acceptFriendRequest(name);
        if (success) {
            showNotification(name + " is now your friend");
        }
        else {
            showErrorNotification("Failed to accept friend request");
        }
    }
    catch (error) {
        console.error("Error in acceptFriendRequest:", error);
        showErrorNotification("Failed to accept friend request");
    }
}
export async function addFriend(name) {
    const success = await FriendsManager.sendFriendRequest(name);
    if (success)
        showNotification(name + " is now requesting to be your friend");
    else
        showErrorNotification("Failed to send friend request");
}
export function setupSearchInput() {
    const input = document.getElementById("friendSearch");
    if (!input)
        return;
    input.addEventListener("input", () => {
        renderPeopleList(input.value);
    });
}
export async function showProfileCard(username, profilePicture, bio, userId) {
    // Fonction pour ajouter un timestamp aux URLs d'images
    const getImageUrl = (imagePath, username) => {
        if (!imagePath || imagePath === 'default-profile.png') {
            return 'default-profile.png';
        }
        // Ajouter un timestamp pour forcer le rechargement
        const timestamp = Date.now();
        return `${imagePath}?v=${timestamp}&user=${username}`;
    };
    // Each time it opens, fetch up-to-date user info
    let userInfo = null;
    try {
        const resp = await fetch(`https://${HOSTNAME}:8443/api/users?username=${encodeURIComponent(username)}`, { credentials: 'include' });
        const data = await resp.json();
        if (data.success && Array.isArray(data.users)) {
            userInfo = data.users.find((u) => u.username === username);
        }
    }
    catch (e) {
        userInfo = null;
    }
    if (userInfo) {
        profilePicture = userInfo.profile_picture || 'default-profile.png';
        bio = userInfo.bio || 'No bio available';
        userId = userInfo.id || userId;
    }
    // Check if a card already exists and remove it
    let existingCard = document.getElementById("profileOverlay");
    if (existingCard) {
        existingCard.remove();
    }
    // Get the current username
    let currentUsername = null;
    try {
        const resp = await fetch(`https://${HOSTNAME}:8443/api/user/infos`, { credentials: "include" });
        const data = await resp.json();
        if (data.success && data.user && data.user.username) {
            currentUsername = data.user.username;
        }
    }
    catch (_a) { }
    // Create an overlay
    const overlay = document.createElement("div");
    overlay.id = "profileOverlay";
    overlay.className = "profile-overlay";
    // Add an event to close the card when clicking outside
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    // Create a new card
    const card = document.createElement("div");
    card.id = "profileCard";
    card.className = "profile-card";
    // Add a container for the block/unblock button at the top left
    const topLeftContainer = document.createElement("div");
    topLeftContainer.style.position = "absolute";
    topLeftContainer.style.top = "10px";
    topLeftContainer.style.left = "10px";
    topLeftContainer.style.zIndex = "2";
    topLeftContainer.style.display = "flex";
    topLeftContainer.style.alignItems = "center";
    // Do not show the block/unblock button if it's the current user's profile
    if (currentUsername !== username) {
        // Add a Block/Unblock button with an icon
        const blockButton = document.createElement("button");
        blockButton.className = "profile-card-block";
        blockButton.style.display = "flex";
        blockButton.style.alignItems = "center";
        blockButton.style.gap = "4px";
        blockButton.textContent = "Loading...";
        // Icon
        const iconSpan = document.createElement("span");
        iconSpan.className = "block-icon";
        iconSpan.textContent = "🔒"; // Default value, changed below
        // Check if the user is blocked
        let isBlocked = false;
        try {
            const resp = await fetch(`https://${HOSTNAME}:8443/api/user/isBlocked`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });
            const data = await resp.json();
            isBlocked = data.isBlocked;
            blockButton.textContent = isBlocked ? "Unblock" : "Block";
            iconSpan.textContent = isBlocked ? "🔓" : "🔒";
        }
        catch (e) {
            blockButton.textContent = "Block";
            iconSpan.textContent = "🔒";
        }
        // Add the icon to the button (before the text)
        blockButton.prepend(iconSpan);
        blockButton.addEventListener("click", async () => {
            var _a;
            blockButton.disabled = true;
            if (!isBlocked) {
                await fetch(`https://${HOSTNAME}:8443/api/user/block`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username })
                });
                isBlocked = true;
                blockButton.textContent = "Unblock";
                iconSpan.textContent = "🔓";
                blockButton.prepend(iconSpan);
            }
            else {
                await fetch(`https://${HOSTNAME}:8443/api/user/unblock`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username })
                });
                isBlocked = false;
                blockButton.textContent = "Block";
                iconSpan.textContent = "🔒";
                blockButton.prepend(iconSpan);
            }
            blockButton.disabled = false;
            try {
                if ((_a = document.getElementById("communitybutton")) === null || _a === void 0 ? void 0 : _a.classList.contains("activebutton")) {
                    // On the community page: clear the chat then restart setupChat
                    const chatContainer = document.getElementById("chatContainer");
                    if (chatContainer)
                        chatContainer.innerHTML = "";
                    const { setupChat } = await import("./chat.js");
                    setupChat();
                }
                else {
                    // Other page, chat widget
                    const { removeChatWidget, setupChatWidget } = await import("./chatWidget.js");
                    removeChatWidget();
                    setupChatWidget();
                }
            }
            catch (e) {
                console.error("Failed to refresh chat after block/unblock", e);
            }
        });
        topLeftContainer.appendChild(blockButton);
    }
    // Add the profile image
    const img = document.createElement("img");
    const isOnline = await FriendsManager.isOnline(username);
    if (isOnline)
        img.className = "profile-card-picture-online";
    else
        img.className = "profile-card-picture";
    img.src = getImageUrl(profilePicture, username);
    img.alt = `${username}'s profile picture`;
    // Add the username
    const name = document.createElement("h3");
    name.className = "profile-card-name";
    name.textContent = username;
    // Add the bio
    const bioElement = document.createElement("p");
    bioElement.className = "profile-card-bio";
    bioElement.textContent = bio || 'No bio available';
    // Add a button to close the card
    const closeButton = document.createElement("button");
    closeButton.className = "profile-card-close";
    closeButton.textContent = "✖";
    closeButton.addEventListener("click", () => {
        overlay.remove();
    });
    // Section merged stats + history
    let statsAndHistorySection = document.createElement("div");
    statsAndHistorySection.className = "profile-card-stats";
    statsAndHistorySection.style.position = "relative";
    // Container for stats (for nicer layout)
    let statsContainer = document.createElement("div");
    statsContainer.className = "profile-card-stats-block";
    statsContainer.style.display = "flex";
    statsContainer.style.justifyContent = "space-around";
    statsContainer.style.alignItems = "center";
    statsContainer.style.gap = "2.5rem";
    statsContainer.style.margin = "10px 0 18px 0";
    // Get user statistics for all games
    let allStats = { win: 0, loss: 0 };
    let perGameStats = {};
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/games/getAll`, { credentials: 'include' });
        const gamesData = await response.json();
        const rankingsResponse = await fetch(`https://${HOSTNAME}:8443/api/games/1/rankings`, { credentials: 'include' });
        const pongRankings = await rankingsResponse.json();
        // Fetch stats for all games
        let allRankings = [];
        if (gamesData.success && Array.isArray(gamesData.games)) {
            for (const game of gamesData.games) {
                const res = await fetch(`https://${HOSTNAME}:8443/api/games/${game.id}/rankings`, { credentials: 'include' });
                const stats = await res.json();
                if (Array.isArray(stats)) {
                    allRankings = allRankings.concat(stats.map((r) => (Object.assign(Object.assign({}, r), { gameId: game.id }))));
                }
            }
        }
        const userIdAsNumber = Number(userId);
        for (const stat of allRankings) {
            if (Number(stat.userId) === userIdAsNumber) {
                allStats.win += stat.win;
                allStats.loss += stat.loss;
                perGameStats[stat.gameId] = { win: stat.win, loss: stat.loss };
            }
        }
    }
    catch (error) {
        allStats = { win: 0, loss: 0 };
        perGameStats = {};
    }
    // Function to update the stats display according to the selected game
    function updateStatsDisplay(gameId) {
        let win, loss;
        const key = gameId && gameId !== "" ? Number(gameId) : null;
        if (!key) {
            win = allStats.win;
            loss = allStats.loss;
        }
        else if (perGameStats[key]) {
            win = perGameStats[key].win;
            loss = perGameStats[key].loss;
        }
        else {
            win = 0;
            loss = 0;
        }
        const playedGames = win + loss;
        const ratio = loss === 0 ? win : (win / loss).toFixed(2);
        statsContainer.innerHTML = `
            <div class="stat-item"><div class="stat-label">Wins</div><div class="stat-value">${win}</div></div>
            <div class="stat-item"><div class="stat-label">Losses</div><div class="stat-value">${loss}</div></div>
            <div class="stat-item"><div class="stat-label">Games</div><div class="stat-value">${playedGames}</div></div>
            <div class="stat-item"><div class="stat-label">Ratio</div><div class="stat-value">${ratio}</div></div>
        `;
    }
    // Add the stats container (the dropdown will be added above by displayMatchHistory)
    statsAndHistorySection.appendChild(statsContainer);
    // Add the card to the overlay
    card.appendChild(topLeftContainer);
    card.appendChild(closeButton);
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(bioElement);
    card.appendChild(statsAndHistorySection); // Merged frame
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    // Fetch and display the match history in the same merged frame
    const matchHistory = await fetchMatchHistory(userId);
    displayMatchHistory(matchHistory, userId, statsAndHistorySection, statsContainer, updateStatsDisplay);
}
// Function to fetch a user's match history
async function fetchMatchHistory(userId, gameId) {
    try {
        let url = `https://${HOSTNAME}:8443/api/match/history/${userId}`;
        if (gameId !== undefined && gameId !== null) {
            url += `?gameId=${gameId}`;
        }
        const response = await fetch(url, {
            credentials: 'include',
        });
        if (response.ok) {
            const data = await response.json();
            return data.matches || [];
        }
        else {
            console.error("Failed to fetch match history:", await response.text());
            return [];
        }
    }
    catch (error) {
        console.error("Error fetching match history:", error);
        return [];
    }
}
let towerGameId = null;
async function getTowerGameId() {
    if (towerGameId !== null)
        return towerGameId;
    try {
        const res = await api.get('/api/games/getAll');
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
            const tower = data.games.find((g) => g.name.toLowerCase() === 'tower');
            if (tower) {
                towerGameId = tower.id;
                return tower.id;
            }
        }
    }
    catch (e) {
        console.error("Error fetching Tower id:", e);
    }
    return 3; // fallback
}
let pongGameId = null;
async function getPongGameId() {
    if (pongGameId !== null)
        return pongGameId;
    try {
        const res = await api.get('/api/games/getAll');
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
            const pong = data.games.find((g) => g.name.toLowerCase() === 'pong');
            if (pong) {
                pongGameId = pong.id;
                return pong.id;
            }
        }
    }
    catch (e) {
        console.error("Error fetching Pong id:", e);
    }
    return 1; // fallback
}
// Function to display the match history in the profile card
// displayMatchHistory: adds the dropdown above statsAndHistorySection, then stats, then the table
async function displayMatchHistory(matches, userId, container, statsContainer, updateStatsDisplay) {
    if (!container)
        return;
    container.innerHTML = "";
    // Retrieve the list of games from the API to get the correct names
    let gamesList = {};
    try {
        const res = await api.get('/api/games/getAll');
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
            for (const game of data.games) {
                gamesList[game.id] = game.name;
            }
        }
    }
    catch (e) { }
    // Retrieve the list of games present in all matches (not just filtered)
    const uniqueGames = {};
    for (const match of matches) {
        if (gamesList[match.game_id]) {
            uniqueGames[match.game_id] = gamesList[match.game_id];
        }
        else if (match.gameName && match.game_id) {
            uniqueGames[match.game_id] = match.gameName;
        }
    }
    if (Object.keys(uniqueGames).length === 0) {
        for (const match of matches) {
            if (gamesList[match.game_id]) {
                uniqueGames[match.game_id] = gamesList[match.game_id];
            }
            else if (match.game_id) {
                uniqueGames[match.game_id] = `Game #${match.game_id}`;
            }
        }
    }
    const gameOptions = Object.entries(uniqueGames);
    // Create the dropdown only once
    let select = document.createElement("select");
    select.className = "match-history-game-filter";
    select.style.marginBottom = "10px";
    select.style.display = "block";
    select.style.margin = "0 auto 18px auto";
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All games";
    select.appendChild(allOption);
    for (const [id, name] of gameOptions) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = name;
        select.appendChild(option);
    }
    container.appendChild(select);
    // Add the stats block just below the dropdown
    if (statsContainer)
        container.appendChild(statsContainer);
    if (updateStatsDisplay)
        updateStatsDisplay(""); // Show "all games" stats by default
    // Function to display the filtered table
    async function renderTable(gameId) {
        if (!container)
            return;
        // Do not erase the dropdown or the stats block
        // Remove everything except the dropdown and the stats block
        while (container.children.length > 2) {
            container.removeChild(container.lastChild);
        }
        let filteredMatches = matches;
        if (gameId) {
            filteredMatches = matches.filter(m => m.game_id === gameId);
        }
        if (filteredMatches.length === 0) {
            const noMatches = document.createElement("p");
            noMatches.textContent = "No match history available.";
            container.appendChild(noMatches);
            return;
        }
        // --- Add a scrollable container around the table ---
        const tableWrapper = document.createElement("div");
        tableWrapper.style.maxHeight = "320px";
        tableWrapper.style.overflowY = "auto";
        tableWrapper.style.width = "100%";
        // --------------------------------------------------
        const matchTable = document.createElement("table");
        matchTable.className = "match-history-table";
        const tableHeader = document.createElement("tr");
        tableHeader.innerHTML = `
            <th>Result</th>
            <th>Player</th>
            <th>Score</th>
            <th>Opponent</th>
            <th>Date</th>
        `;
        matchTable.appendChild(tableHeader);
        // Correction: use filteredMatches.slice(0, 10) instead of recentMatches
        const recentMatches = filteredMatches.slice(0, 10);
        for (const match of recentMatches) {
            try {
                const isUser1 = match.user1_id === userId;
                const userLives = isUser1 ? match.user1_lives : match.user2_lives;
                const opponentLives = isUser1 ? match.user2_lives : match.user1_lives;
                const towerId = await getTowerGameId();
                const pongId = await getPongGameId();
                let userPoints, opponentPoints;
                if (match.game_id === towerId) {
                    userPoints = Math.max(0, Math.min(100, Number(userLives)));
                    opponentPoints = Math.max(0, Math.min(100, Number(opponentLives)));
                }
                else if (match.game_id === pongId) {
                    userPoints = Math.max(0, Math.min(3, 3 - Number(opponentLives)));
                    opponentPoints = Math.max(0, Math.min(3, 3 - Number(userLives)));
                }
                else {
                    userPoints = Math.max(0, Math.min(3, 3 - Number(opponentLives)));
                    opponentPoints = Math.max(0, Math.min(3, 3 - Number(userLives)));
                }
                const result = userPoints > opponentPoints ? "Victory" : "Defeat";
                const opponentName = isUser1 ? match.user2Name : match.user1Name;
                const userName = isUser1 ? match.user1Name : match.user2Name;
                const matchDate = new Date(match.match_date).toLocaleDateString();
                const row = document.createElement("tr");
                row.className = result.toLowerCase();
                row.innerHTML = `
                    <td class="${result.toLowerCase()}">${result}</td>
                    <td class="player-name">${userName}</td>
                    <td class="score-cell"><span class="user-score">${userPoints}</span> - <span class="opponent-score">${opponentPoints}</span></td>
                    <td class="opponent-name">${opponentName}</td>
                    <td class="match-date">${matchDate}</td>
                `;
                matchTable.appendChild(row);
            }
            catch (error) {
                console.error("Error displaying match:", error, match);
            }
        }
        tableWrapper.appendChild(matchTable);
        container.appendChild(tableWrapper);
        // No more "show all matches" button
    }
    // Display the full table
    async function renderFullTable(filteredMatches) {
        if (!container)
            return;
        container.innerHTML = "";
        container.appendChild(select);
        const matchTable = document.createElement("table");
        matchTable.className = "match-history-table";
        const tableHeader = document.createElement("tr");
        tableHeader.innerHTML = `
            <th>Result</th>
            <th>Player</th>
            <th>Score</th>
            <th>Opponent</th>
            <th>Date</th>
        `;
        matchTable.appendChild(tableHeader);
        for (const match of filteredMatches) {
            try {
                const isUser1 = match.user1_id === userId;
                const userLives = isUser1 ? match.user1_lives : match.user2_lives;
                const opponentLives = isUser1 ? match.user2_lives : match.user1_lives;
                const towerId = await getTowerGameId();
                const pongId = await getPongGameId();
                let userPoints, opponentPoints;
                if (match.game_id === towerId) {
                    userPoints = Math.max(0, Math.min(100, Number(userLives)));
                    opponentPoints = Math.max(0, Math.min(100, Number(opponentLives)));
                }
                else if (match.game_id === pongId) {
                    userPoints = Math.max(0, Math.min(3, 3 - Number(opponentLives)));
                    opponentPoints = Math.max(0, Math.min(3, 3 - Number(userLives)));
                }
                else {
                    userPoints = Math.max(0, Math.min(3, 3 - Number(opponentLives)));
                    opponentPoints = Math.max(0, Math.min(3, 3 - Number(userLives)));
                }
                const result = userPoints > opponentPoints ? "Victory" : "Defeat";
                const opponentName = isUser1 ? match.user2Name : match.user1Name;
                const userName = isUser1 ? match.user1Name : match.user2Name;
                const matchDate = new Date(match.match_date).toLocaleDateString();
                const row = document.createElement("tr");
                row.className = result.toLowerCase();
                row.innerHTML = `
                    <td class="${result.toLowerCase()}">${result}</td>
                    <td class="player-name">${userName}</td>
                    <td class="score-cell"><span class="user-score">${userPoints}</span> - <span class="opponent-score">${opponentPoints}</span></td>
                    <td class="opponent-name">${opponentName}</td>
                    <td class="match-date">${matchDate}</td>
                `;
                matchTable.appendChild(row);
            }
            catch (error) {
                console.error("Error displaying full match:", error, match);
            }
        }
        container.appendChild(matchTable);
        const showLessLink = document.createElement("a");
        showLessLink.textContent = "Show less";
        showLessLink.href = "#";
        showLessLink.className = "view-less-matches";
        showLessLink.addEventListener("click", (e) => {
            e.preventDefault();
            renderTable(Number(select.value) || null);
        });
        container.appendChild(showLessLink);
    }
    // Dropdown listener: local filter, no reload
    select.addEventListener("change", () => {
        const selectedGameId = select.value ? select.value : null;
        if (updateStatsDisplay)
            updateStatsDisplay(selectedGameId);
        renderTable(selectedGameId ? Number(selectedGameId) : null);
    });
    renderTable(null);
}
