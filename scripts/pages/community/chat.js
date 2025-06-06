import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
import { isBlocked, clearBlockedCache } from "../../helpers/blockedUsers.js";
async function fetchCurrentUser() {
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/user/infos`, {
            credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
            return { id: data.user.id, username: data.user.username };
        }
        else {
            console.error("Failed to fetch user info:", data.message);
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
}
async function fetchChatHistory(userId) {
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/chat/history?userId=${userId}`, {
            credentials: "include"
        });
        const data = await response.json();
        if (data.success) {
            return data.messages;
        }
        else {
            console.error("Failed to fetch chat history:", data.message);
            return [];
        }
    }
    catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
}
// Ajout : gestion des liens d'invitation de partie Pong
function handleGameInviteLink() {
    document.addEventListener('click', async function (e) {
        const target = e.target;
        if (target && target.tagName === 'A' && target.href && target.href.includes('/pong/join?room=')) {
            e.preventDefault();
            // Extraire l'ID de la room depuis l'URL
            const url = new URL(target.href);
            const roomId = url.searchParams.get('room');
            if (!roomId)
                return;
            // Vérifier si la room existe avant d'ouvrir le modal
            try {
                const resp = await fetch(`/api/pong/room-exists?roomId=${encodeURIComponent(roomId)}`, { credentials: "include" });
                const data = await resp.json();
                if (!data.success || !data.exists) {
                    showErrorNotification("link expired");
                    return;
                }
            }
            catch (err) {
                showErrorNotification("link expired");
                return;
            }
            // Charge la page library en arrière-plan pour éviter de garder community
            const libraryBtn = document.getElementById('librarybutton');
            if (libraryBtn) {
                libraryBtn.click();
                await new Promise(res => setTimeout(res, 100));
            }
            // Ouvre le modal de jeu façon overlay
            let modal = document.getElementById('optionnalModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'optionnalModal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = `
              <div class="modal-overlay" id="modalWindow">
                <div class="game-modal" id="games-modal"></div>
                <button class="close-modal" id="closeGameModal">&times;</button>
              </div>
            `;
            document.getElementById('closeGameModal').onclick = () => { modal.innerHTML = ''; };
            // Appel la fonction centralisée pour lancer Pong via le lien
            const { launchPongFromLink } = await import('../../games/pong/main.js');
            launchPongFromLink(roomId);
        }
    });
}
export async function setupChat() {
    var _a;
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");
    const chatContainer = document.getElementById("chatContainer");
    // Ajout du conteneur pour la suggestion d'utilisateurs
    let mentionBox = document.getElementById("mention-suggestions");
    if (!mentionBox) {
        mentionBox = document.createElement("div");
        mentionBox.id = "mention-suggestions";
        mentionBox.className = "mention-suggestions-box";
        // Ajoute la box à body pour overlay flottant
        document.body.appendChild(mentionBox);
    }
    // Vérification auth avant d'afficher le chat
    let currentUser = await fetchCurrentUser();
    if (!currentUser) {
        if (chatContainer)
            chatContainer.innerHTML = "<div class='chat-error'>Vous devez être connecté pour utiliser le chat.</div>";
        if (input)
            input.style.display = 'none';
        if (sendBtn)
            sendBtn.style.display = 'none';
        return;
    }
    if (!input || !sendBtn || !chatContainer) {
        console.error("Chat elements not found in the DOM.");
        return;
    }
    // Récupérer les informations des utilisateurs
    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.id, user]));
    const usernames = users.map(u => u.username);
    // Grouper les messages par auteur pour un affichage Messenger-like
    let lastAuthor = null;
    const addMessage = (content, authorIdRaw, self = true) => {
        const authorId = Number(authorIdRaw);
        const isGrouped = lastAuthor === authorId;
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `messenger-message-wrapper${self ? " self" : ""}${isGrouped ? " grouped" : ""}`;
        // Affiche le nom uniquement pour les messages reçus et seulement pour le premier message du groupe
        if (!self && !isGrouped) {
            const user = userMap.get(authorId);
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = (user === null || user === void 0 ? void 0 : user.username) || `User#${authorId}`;
            usernameSpan.className = `messenger-username`;
            msgWrapper.appendChild(usernameSpan);
        }
        const row = document.createElement("div");
        row.className = "messenger-message-row";
        const messageContent = document.createElement("div");
        let mentionMatch = content.match(/^@(\w+)/);
        let mentionClass = (!self && mentionMatch) ? " messenger-bubble-mention" : "";
        if (!self && mentionMatch) {
            messageContent.innerHTML = content.replace(/^@(\w+)/, '<span class="chat-mention">@$1</span>');
        }
        else if (self && mentionMatch) {
            messageContent.innerHTML = content.replace(/^@(\w+)/, '<span class="chat-mention self">@$1</span>');
        }
        else {
            messageContent.textContent = content;
        }
        messageContent.className = `messenger-bubble${self ? " self" : ""}${mentionClass}`;
        if (!self && !isGrouped) {
            // Avatar à gauche, bulle à droite
            const user = userMap.get(authorId);
            const profileImg = document.createElement("img");
            profileImg.src = (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png";
            profileImg.alt = `${(user === null || user === void 0 ? void 0 : user.username) || authorId}'s profile picture`;
            profileImg.className = "messenger-avatar";
            profileImg.onclick = () => showProfileCard((user === null || user === void 0 ? void 0 : user.username) || `User#${authorId}`, (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png", (user === null || user === void 0 ? void 0 : user.email) || "Email not available", (user === null || user === void 0 ? void 0 : user.bio) || "No bio available", (user === null || user === void 0 ? void 0 : user.id) || 0);
            row.appendChild(profileImg);
            row.appendChild(messageContent);
        }
        else if (!self && isGrouped) {
            // Spacer à gauche, bulle à droite
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
            row.appendChild(messageContent);
        }
        else if (self && !isGrouped) {
            // Bulle à gauche, spacer à droite (row-reverse via CSS)
            row.appendChild(messageContent);
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        else if (self && isGrouped) {
            // Bulle à gauche, spacer à droite (row-reverse via CSS)
            row.appendChild(messageContent);
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        msgWrapper.appendChild(row);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        lastAuthor = authorId;
    };
    // Charger l'historique des messages
    const chatHistory = await fetchChatHistory(currentUser.id);
    // Affichage de l'historique avec groupement
    let prevAuthor = null;
    for (const message of chatHistory) {
        const isSelf = message.author === currentUser.id;
        if (!isSelf && await isBlocked(((_a = userMap.get(message.author)) === null || _a === void 0 ? void 0 : _a.username) || ""))
            continue;
        addMessage(message.content, message.author, isSelf);
    }
    // Connecter le client au serveur socket.IO
    const socket = io(`https://${HOSTNAME}:8443/chat`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
        if (!currentUser) {
            // Impossible d'émettre le register sans utilisateur courant
            return;
        }
        socket.emit("register", { userId: currentUser.id, username: currentUser.username });
    });
    socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
    });
    socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
    });
    let canSend = true;
    const COOLDOWN_MS = 1000;
    // Variable pour suivre les messages non lus
    let unreadCount = 0;
    // Fonction pour afficher le badge de notification
    function showBadge() {
        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.textContent = unreadCount.toString();
            badge.style.display = 'block';
        }
    }
    // Fonction pour réinitialiser le compteur de messages non lus
    function resetBadge() {
        unreadCount = 0;
        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
    // Envoyer un message au serveur
    sendBtn.addEventListener("click", async () => {
        // Revérifie l'authentification à chaque envoi
        if (!canSend) {
            return;
        }
        currentUser = await fetchCurrentUser();
        if (!currentUser) {
            if (chatContainer)
                chatContainer.innerHTML = "<div class='chat-error'>Vous avez été déconnecté. Merci de vous reconnecter pour utiliser le chat.</div>";
            if (input)
                input.style.display = 'none';
            if (sendBtn)
                sendBtn.style.display = 'none';
            return;
        }
        const text = input.value.trim();
        if (text) {
            const mentionMatch = text.match(/^@(\w+)/);
            canSend = false;
            sendBtn.disabled = true;
            if (mentionMatch && mentionMatch[1] === currentUser.username) {
                showErrorNotification("You can't mention yourself.");
                canSend = true;
                sendBtn.disabled = false;
                return;
            }
            if (mentionMatch) {
                const targetUser = users.find(u => u.username === mentionMatch[1]);
                if (!targetUser) {
                    showErrorNotification("User not found");
                    canSend = true;
                    sendBtn.disabled = false;
                    return;
                }
                socket.emit("sendPrivateMessage", { to: String(targetUser.id), author: String(currentUser.id), content: text }, (response) => { });
                addMessage(text, currentUser.id, true);
            }
            else {
                socket.emit("sendMessage", { author: currentUser.id, content: text }, (response) => { });
                addMessage(text, currentUser.id, true);
            }
            input.value = "";
            setTimeout(() => {
                canSend = true;
                sendBtn.disabled = false;
            }, COOLDOWN_MS);
        }
    });
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });
    // Recevoir un message du serveur
    socket.on("receiveMessage", async (messageData) => {
        var _a;
        const authorId = Number(messageData.author);
        if (!currentUser)
            return;
        if (authorId === currentUser.id)
            return;
        if (await isBlocked(((_a = userMap.get(authorId)) === null || _a === void 0 ? void 0 : _a.username) || ""))
            return;
        if (!userMap.has(authorId)) {
            const newUsers = await fetchUsernames();
            userMap.clear();
            newUsers.forEach(user => userMap.set(user.id, user));
            if (document.getElementById('friendList')) {
                const { renderPeopleList } = await import('./peopleList.js');
                renderPeopleList();
            }
        }
        addMessage(messageData.content, authorId, false);
    });
    socket.on("receivePrivateMessage", async (messageData) => {
        var _a;
        const authorId = Number(messageData.author);
        // Toujours mettre à jour le userMap avec les infos reçues
        if (messageData.authorInfo) {
            userMap.set(authorId, {
                id: messageData.authorInfo.id,
                username: messageData.authorInfo.username,
                profile_picture: messageData.authorInfo.profile_picture,
                email: '',
                bio: '',
                isOnline: false
            });
        }
        if (await isBlocked(((_a = userMap.get(authorId)) === null || _a === void 0 ? void 0 : _a.username) || ""))
            return;
        if (!userMap.has(authorId)) {
            const newUsers = await fetchUsernames();
            newUsers.forEach(user => userMap.set(user.id, user));
        }
        addMessage(messageData.content, authorId, false);
    });
    // Suggestion de mention @
    let mentionActive = false;
    let mentionStart = -1;
    let filteredSuggestions = [];
    function updateMentionBox() {
        if (!mentionActive || filteredSuggestions.length === 0) {
            mentionBox.style.display = "none";
            return;
        }
        mentionBox.innerHTML = "";
        filteredSuggestions.forEach(username => {
            const item = document.createElement("div");
            item.textContent = "@" + username;
            item.style.padding = "6px 16px";
            item.style.cursor = "pointer";
            item.style.color = "#66c0f4";
            item.onmouseenter = () => item.style.background = "#2a475e";
            item.onmouseleave = () => item.style.background = "";
            item.onclick = () => {
                // Remplace le @... par @username
                const val = input.value;
                const before = val.slice(0, mentionStart);
                const after = val.slice(input.selectionStart);
                input.value = before + "@" + username + " " + after;
                mentionBox.style.display = "none";
                mentionActive = false;
                input.focus();
                // Place le curseur après la mention
                const pos = (before + "@" + username + " ").length;
                input.setSelectionRange(pos, pos);
            };
            mentionBox.appendChild(item);
        });
        // Positionne la box juste sous l'input, overlay flottant
        const rect = input.getBoundingClientRect();
        mentionBox.style.left = rect.left + "px";
        mentionBox.style.top = (rect.bottom + 2) + "px";
        mentionBox.style.width = rect.width + "px";
        mentionBox.style.display = "block";
    }
    // Ajout : repositionne la mentionBox lors du resize
    window.addEventListener("resize", () => {
        if (mentionActive && mentionBox.style.display === "block") {
            updateMentionBox();
        }
    });
    input.addEventListener("input", (e) => {
        const val = input.value;
        const pos = input.selectionStart || 0;
        // Recherche le dernier @ avant le curseur
        const before = val.slice(0, pos);
        const match = before.match(/@([\w]*)$/);
        if (match) {
            mentionActive = true;
            mentionStart = before.lastIndexOf("@");
            const search = match[1].toLowerCase();
            if (!currentUser) {
                filteredSuggestions = [];
            }
            else {
                filteredSuggestions = usernames.filter(u => u.toLowerCase().startsWith(search) && u !== (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username)).slice(0, 8);
            }
            updateMentionBox();
        }
        else {
            mentionActive = false;
            mentionBox.style.display = "none";
        }
    });
    // Ferme la box si on clique ailleurs
    document.addEventListener("click", (e) => {
        if (e.target !== input && e.target !== mentionBox) {
            mentionBox.style.display = "none";
            mentionActive = false;
        }
    });
    // Navigation clavier (flèches + entrée)
    input.addEventListener("keydown", (e) => {
        if (!mentionActive || mentionBox.style.display === "none")
            return;
        const items = Array.from(mentionBox.children);
        let idx = items.findIndex(item => item.classList.contains("active"));
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (idx >= 0)
                items[idx].classList.remove("active");
            idx = (idx + 1) % items.length;
            items[idx].classList.add("active");
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (idx >= 0)
                items[idx].classList.remove("active");
            idx = (idx - 1 + items.length) % items.length;
            items[idx].classList.add("active");
        }
        else if (e.key === "Enter" && idx >= 0) {
            e.preventDefault();
            items[idx].click();
        }
    });
    // Vider le cache partagé au début de setupChat
    clearBlockedCache();
    handleGameInviteLink();
}
