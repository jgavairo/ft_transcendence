import { showErrorNotification, showNotification } from "../../helpers/notifications.js";
import { HOSTNAME } from "../../main.js";
import { FriendsManager } from "../../managers/friendsManager.js";
import api from "../../helpers/api.js";
const STORAGE_KEY = "people";
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
    const communityButton = document.getElementById('communitybutton');
    if (!(communityButton === null || communityButton === void 0 ? void 0 : communityButton.classList.contains('activebutton'))) {
        console.log('Not in community page, skipping renderPeopleList');
        return;
    }
    const container = document.getElementById("friendList");
    if (!container) {
        console.error("❌ #friendList introuvable");
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
        // Nettoyer le conteneur (supprime tous les event listeners)
        container.innerHTML = "";
        // Rendre tous les éléments en une seule fois
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
            // Rendre tout l'item cliquable
            div.addEventListener("click", () => {
                showProfileCard(person.username, person.profile_picture, person.email, person.bio, person.id);
            });
            // Conteneur pour l'image de profil
            const profileContainer = document.createElement("div");
            profileContainer.className = "profile-picture-container";
            // Ajouter l'image de profil
            const img = document.createElement("img");
            const isOnline = await FriendsManager.isOnline(person.username);
            if (isOnline)
                img.className = "profile-picture online";
            else
                img.className = "profile-picture";
            img.src = person.profile_picture || "default-profile.png";
            img.alt = `${person.username}'s profile picture`;
            profileContainer.appendChild(img);
            // Supprimer l'overlay "view"
            div.appendChild(profileContainer);
            const label = document.createElement("span");
            label.className = "friend-name";
            label.textContent = person.username;
            // Grouper la photo et le nom dans un conteneur .friend-info
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
    console.log('Refusing friend request from:', name);
    const success = await FriendsManager.refuseFriendRequest(name);
    if (success) {
        console.log('Friend request refused successfully');
        showNotification("Friend request from " + name + " has been refused");
    }
    else {
        console.error('Failed to refuse friend request');
        showErrorNotification("Failed to refuse friend request");
    }
}
export async function cancelFriendRequest(name) {
    console.log('Cancelling friend request to:', name);
    const success = await FriendsManager.cancelFriendRequest(name);
    if (success) {
        console.log("Friend request cancelled successfully");
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
        console.log("removeFriend: " + name);
        const success = await FriendsManager.removeFriend(name);
        if (success) {
            console.log("Friend removed successfully");
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
        console.log('Accepting friend request from:', name);
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
export async function showProfileCard(username, profilePicture, email, bio, userId) {
    // À chaque ouverture, on va chercher les infos utilisateur à jour
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
        email = userInfo.email || 'Email not available';
        bio = userInfo.bio || 'No bio available';
        userId = userInfo.id || userId;
    }
    // Vérifiez si une carte existe déjà et la supprimez
    let existingCard = document.getElementById("profileOverlay");
    if (existingCard) {
        existingCard.remove();
    }
    // Récupérer le username courant
    let currentUsername = null;
    try {
        const resp = await fetch(`https://${HOSTNAME}:8443/api/user/infos`, { credentials: "include" });
        const data = await resp.json();
        if (data.success && data.user && data.user.username) {
            currentUsername = data.user.username;
        }
    }
    catch (_a) { }
    // Créez un overlay
    const overlay = document.createElement("div");
    overlay.id = "profileOverlay";
    overlay.className = "profile-overlay";
    // Ajoutez un événement pour fermer la carte lorsqu'on clique en dehors
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    // Créez une nouvelle carte
    const card = document.createElement("div");
    card.id = "profileCard";
    card.className = "profile-card";
    // Ajoutez un conteneur pour le bouton block/unblock en haut à gauche
    const topLeftContainer = document.createElement("div");
    topLeftContainer.style.position = "absolute";
    topLeftContainer.style.top = "10px";
    topLeftContainer.style.left = "10px";
    topLeftContainer.style.zIndex = "2";
    topLeftContainer.style.display = "flex";
    topLeftContainer.style.alignItems = "center";
    // N'affiche pas le bouton block/unblock si c'est le profil de l'utilisateur courant
    if (currentUsername !== username) {
        // Ajoutez un bouton Block/Unblock avec une icône
        const blockButton = document.createElement("button");
        blockButton.className = "profile-card-block";
        blockButton.style.display = "flex";
        blockButton.style.alignItems = "center";
        blockButton.style.gap = "4px";
        blockButton.textContent = "Loading...";
        // Icône
        const iconSpan = document.createElement("span");
        iconSpan.className = "block-icon";
        iconSpan.textContent = "🔒"; // Valeur par défaut, changée plus bas
        // Vérifier si l'utilisateur est bloqué
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
        // Ajoute l'icône au bouton (avant le texte)
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
                    // On est sur la page communauté : vider le chat puis relancer setupChat
                    const chatContainer = document.getElementById("chatContainer");
                    if (chatContainer)
                        chatContainer.innerHTML = "";
                    const { setupChat } = await import("./chat.js");
                    setupChat();
                }
                else {
                    // Autre page, widget chat
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
    // Ajoutez l'image de profil
    const img = document.createElement("img");
    const isOnline = await FriendsManager.isOnline(username);
    if (isOnline)
        img.className = "profile-card-picture-online";
    else
        img.className = "profile-card-picture";
    img.src = profilePicture;
    img.alt = `${username}'s profile picture`;
    // Ajoutez le nom d'utilisateur
    const name = document.createElement("h3");
    name.className = "profile-card-name";
    name.textContent = username;
    // Ajoutez l'email
    const emailElement = document.createElement("p");
    emailElement.className = "profile-card-email";
    emailElement.textContent = `Email: ${email}`;
    // Ajoutez la bio
    const bioElement = document.createElement("p");
    bioElement.className = "profile-card-bio";
    bioElement.textContent = bio || "No bio available";
    // Ajoutez un bouton pour fermer la carte
    const closeButton = document.createElement("button");
    closeButton.className = "profile-card-close";
    closeButton.textContent = "✖";
    closeButton.addEventListener("click", () => {
        overlay.remove();
    });
    // Ajoutez une section pour les statistiques
    const statsSection = document.createElement("div");
    statsSection.className = "profile-card-stats";
    statsSection.textContent = "Loading stats...";
    // Récupérez les statistiques de l'utilisateur
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/games/1/rankings`, {
            credentials: 'include',
        });
        const rankings = await response.json();
        // Convertir en nombre pour s'assurer que la comparaison fonctionne
        const userIdAsNumber = Number(userId);
        // Afficher les données pour le débogage
        console.log("Rankings data:", rankings);
        console.log("Looking for userId:", userIdAsNumber);
        // Trouver les stats de l'utilisateur en s'assurant que les types correspondent
        const userStats = rankings.find((ranking) => Number(ranking.userId) === userIdAsNumber);
        if (userStats) {
            console.log("Found user stats:", userStats);
            const { win, loss } = userStats;
            const playedGames = win + loss;
            const ratio = loss === 0 ? win : (win / loss).toFixed(2);
            statsSection.innerHTML = `
                <h4>1vs1 Online Stats</h4>
                <p><strong>Wins:</strong> ${win}</p>
                <p><strong>Losses:</strong> ${loss}</p>
                <p><strong>Games Played:</strong> ${playedGames}</p>
                <p><strong>Win/Loss Ratio:</strong> ${ratio}</p>
            `;
        }
        else {
            console.log("No stats found for userId:", userIdAsNumber);
            statsSection.textContent = "No stats available.";
        }
    }
    catch (error) {
        console.error("Error fetching user stats:", error);
        statsSection.textContent = "Failed to load stats.";
    }
    // Ajoutez le bouton block/unblock en haut à gauche AVANT les autres éléments
    card.appendChild(topLeftContainer);
    // Ajoutez les éléments à la carte
    card.appendChild(closeButton);
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(emailElement);
    card.appendChild(bioElement);
    // (ne pas ajouter blockButton ici, il est déjà dans topLeftContainer)
    card.appendChild(statsSection);
    // Ajoutez la carte à l'overlay
    overlay.appendChild(card);
    // Ajoutez l'overlay au body
    document.body.appendChild(overlay);
    // Récupérez et affichez l'historique des matchs
    const matchHistory = await fetchMatchHistory(userId);
    displayMatchHistory(matchHistory, userId);
}
// Fonction pour récupérer l'historique des matchs d'un utilisateur
async function fetchMatchHistory(userId) {
    try {
        // Utiliser l'API pour récupérer l'historique des matchs avec les noms des joueurs
        const response = await fetch(`https://${HOSTNAME}:8443/api/match/history/${userId}`, {
            credentials: 'include',
        });
        if (response.ok) {
            const data = await response.json();
            console.log("Match history data:", data);
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
// Fonction pour afficher l'historique des matchs dans la carte de profil
function displayMatchHistory(matches, userId) {
    var _a;
    const card = document.getElementById("profileCard");
    if (!card)
        return;
    // Vérifier s'il y a déjà une section d'historique des matchs, sinon en créer une nouvelle
    let historySection = document.querySelector(".profile-card-match-history");
    if (!historySection) {
        historySection = document.createElement("div");
        historySection.className = "profile-card-match-history";
        card.appendChild(historySection);
    }
    // Définir le titre de la section
    const historyTitle = document.createElement("h4");
    historyTitle.textContent = "Match History";
    if (historySection) {
        historySection.innerHTML = "";
        historySection.appendChild(historyTitle);
    }
    if (matches.length === 0) {
        const noMatches = document.createElement("p");
        noMatches.textContent = "No match history available.";
        if (historySection) {
            historySection.appendChild(noMatches);
        }
        return;
    }
    // Récupérer le nom du profil affiché
    const profileName = ((_a = document.querySelector(".profile-card-name")) === null || _a === void 0 ? void 0 : _a.textContent) || "User";
    // Limiter à 5 matchs maximum pour ne pas surcharger l'interface
    const recentMatches = matches.slice(0, 5);
    // Créer un tableau pour les matchs
    const matchTable = document.createElement("table");
    matchTable.className = "match-history-table";
    // Créer l'en-tête du tableau avec le nouveau format
    const tableHeader = document.createElement("tr");
    tableHeader.innerHTML = `
        <th>Result</th>
        <th>Player</th>
        <th>Score</th>
        <th>Opponent</th>
        <th>Date</th>
    `;
    matchTable.appendChild(tableHeader);
    // Ajouter chaque match au tableau
    for (const match of recentMatches) {
        try {
            // Déterminer si l'utilisateur affiché est user1 ou user2
            const isUser1 = match.user1_id === userId;
            const userLives = isUser1 ? match.user1_lives : match.user2_lives;
            const opponentLives = isUser1 ? match.user2_lives : match.user1_lives;
            // Calculer les points marqués (3 vies au départ, points = 3 - vies de l'adversaire)
            const userPoints = 3 - opponentLives;
            const opponentPoints = 3 - userLives;
            // Déterminer le résultat
            const result = userLives > opponentLives ? "Victory" : "Defeat";
            // Récupérer le nom de l'adversaire en utilisant les noms réels des joueurs
            const opponentName = isUser1 ? match.user2Name : match.user1Name;
            const userName = isUser1 ? match.user1Name : match.user2Name;
            // Formater la date
            const matchDate = new Date(match.match_date).toLocaleDateString();
            // Créer la ligne du tableau avec le nouveau format et les points marqués
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
    if (historySection) {
        historySection.appendChild(matchTable);
    }
    // Ajouter un lien pour voir tous les matchs si nécessaire
    if (matches.length > 5) {
        const viewMoreLink = document.createElement("a");
        viewMoreLink.textContent = "View all matches";
        viewMoreLink.href = "#";
        viewMoreLink.className = "view-more-matches";
        viewMoreLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (historySection) {
                historySection.innerHTML = "";
                historySection.appendChild(historyTitle);
                const fullMatchTable = document.createElement("table");
                fullMatchTable.className = "match-history-table";
                fullMatchTable.appendChild(tableHeader.cloneNode(true));
                for (const match of matches) {
                    try {
                        const isUser1 = match.user1_id === userId;
                        const userLives = isUser1 ? match.user1_lives : match.user2_lives;
                        const opponentLives = isUser1 ? match.user2_lives : match.user1_lives;
                        // Calculer les points marqués (3 vies au départ, points = 3 - vies de l'adversaire)
                        const userPoints = 3 - opponentLives;
                        const opponentPoints = 3 - userLives;
                        const result = userLives > opponentLives ? "Victory" : "Defeat";
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
                        fullMatchTable.appendChild(row);
                    }
                    catch (error) {
                        console.error("Error displaying full match:", error, match);
                    }
                }
                historySection.appendChild(fullMatchTable);
                const showLessLink = document.createElement("a");
                showLessLink.textContent = "Show less";
                showLessLink.href = "#";
                showLessLink.className = "view-less-matches";
                showLessLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    displayMatchHistory(matches, userId);
                });
                historySection.appendChild(showLessLink);
            }
        });
        if (historySection) {
            historySection.appendChild(viewMoreLink);
        }
    }
}
