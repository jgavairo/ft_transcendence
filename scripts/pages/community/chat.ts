import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
async function fetchCurrentUser(): Promise<string | null> {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/user/infos`, {
            credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
            return data.user.username;
        } else {
            console.error("Failed to fetch user info:", data.message);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
}

async function fetchChatHistory(): Promise<{ author: string, content: string, timestamp: string }[]> {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/chat/history`, {
            credentials: "include"
        });
        const data = await response.json();
        if (data.success) {
            return data.messages;
        } else {
            console.error("Failed to fetch chat history:", data.message);
            return [];
        }
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return [];
    }
}

export async function setupChat() {
    const input = document.getElementById("chatInput") as HTMLInputElement;
    const sendBtn = document.getElementById("sendMessage") as HTMLButtonElement;
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
    let username = await fetchCurrentUser();
    if (!username) {
        if (chatContainer) chatContainer.innerHTML = "<div class='chat-error'>Vous devez être connecté pour utiliser le chat.</div>";
        if (input) input.style.display = 'none';
        if (sendBtn) sendBtn.style.display = 'none';
        return;
    }

    if (!input || !sendBtn || !chatContainer) {
        console.error("Chat elements not found in the DOM.");
        return;
    }

    // Récupérer les informations des utilisateurs
    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.username, user]));
    const usernames = users.map(u => u.username);

    // Grouper les messages par auteur pour un affichage Messenger-like
    let lastAuthor: string | null = null;
    const addMessage = (content: string, author: string, self = true) => {
        const isGrouped = lastAuthor === author;
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `messenger-message-wrapper${self ? " self" : ""}${isGrouped ? " grouped" : ""}`;
        // Affiche le nom uniquement pour les messages reçus et seulement pour le premier message du groupe
        if (!self && !isGrouped) {
            const user = userMap.get(author);
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = user?.username || author;
            usernameSpan.className = `messenger-username`;
            msgWrapper.appendChild(usernameSpan);
        }
        const row = document.createElement("div");
        row.className = "messenger-message-row";
        const messageContent = document.createElement("div");
        let mentionMatch = content.match(/^@(\w+)/);
        let mentionClass = (!self && mentionMatch) ? " messenger-bubble-mention" : "";
        if (!self && mentionMatch) {
            messageContent.innerHTML = content.replace(
                /^@(\w+)/,
                '<span class="mention">@$1</span>'
            );
        } else if (self && mentionMatch) {
            messageContent.innerHTML = content.replace(
                /^@(\w+)/,
                '<span class="mention self">@$1</span>'
            );
        } else {
            messageContent.textContent = content;
        }
        messageContent.className = `messenger-bubble${self ? " self" : ""}${mentionClass}`;
        if (!self && !isGrouped) {
            // Avatar à gauche, bulle à droite
            const user = userMap.get(author);
            const profileImg = document.createElement("img");
            profileImg.src = user?.profile_picture || "default-profile.png";
            profileImg.alt = `${author}'s profile picture`;
            profileImg.className = "messenger-avatar";
            profileImg.onclick = () => showProfileCard(user?.username || author, user?.profile_picture || "default-profile.png", user?.email || "Email not available", user?.bio || "No bio available", user?.id || 0);
            row.appendChild(profileImg);
            row.appendChild(messageContent);
        } else if (!self && isGrouped) {
            // Spacer à gauche, bulle à droite
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
            row.appendChild(messageContent);
        } else if (self && !isGrouped) {
            // Bulle à gauche, spacer à droite (row-reverse via CSS)
            row.appendChild(messageContent);
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        } else if (self && isGrouped) {
            // Bulle à gauche, spacer à droite (row-reverse via CSS)
            row.appendChild(messageContent);
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        msgWrapper.appendChild(row);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        lastAuthor = author;
    };

    // Charger l'historique des messages
    const chatHistory = await fetchChatHistory();
    // Affichage de l'historique avec groupement
    let prevAuthor: string | null = null;
    chatHistory.forEach(message => {
        // Filtre : si le message commence par @"quelqu'un" et que ce n'est pas moi, on n'affiche pas
        const mentionMatch = message.content.match(/^@(\w+)/);
        if (mentionMatch && mentionMatch[1] !== username) {
            if (!(message.author === username))
                return;
        }
        const isSelf = message.author === username;
        addMessage(message.content, message.author, isSelf);
        prevAuthor = message.author;
    });

    // Connecter le client au serveur socket.IO
    const socket = io(`http://${HOSTNAME}:3000/chat`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
        socket.emit("register", { username });
    });

    socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
    });

    socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
    });

    let canSend = true;
    const COOLDOWN_MS = 1000;
    // Envoyer un message au serveur
    sendBtn.addEventListener("click", async () => {
        // Revérifie l'authentification à chaque envoi
        if (!canSend) {
            return;
        }
        username = await fetchCurrentUser();
        if (!username) {
            if (chatContainer) chatContainer.innerHTML = "<div class='chat-error'>Vous avez été déconnecté. Merci de vous reconnecter pour utiliser le chat.</div>";
            if (input) input.style.display = 'none';
            if (sendBtn) sendBtn.style.display = 'none';
            return;
        }
        const text = input.value.trim();
        if (text) {
            const mentionMatch = text.match(/^@(\w+)/);
            canSend = false;
            sendBtn.disabled = true;
            
            if (mentionMatch && mentionMatch[1] === username) {
                showErrorNotification("You can't mention yourself.");
                canSend = true;
                sendBtn.disabled = false;
                return;
            }
            if (mentionMatch) {
                const targetUsername = mentionMatch[1];
                socket.emit("sendPrivateMessage", { to: targetUsername, author: username, content: text }, (response: { success: boolean; error?: string }) => {});
                addMessage(text, username, true);
            } else {
                socket.emit("sendMessage", { author: username, content: text }, (response: { success: boolean; error?: string }) => {});
                addMessage(text, username, true);
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
    socket.on("receiveMessage", (messageData: { author: string, content: string }) => {
        if (messageData.author === username) {
            return;
        }
        addMessage(messageData.content, messageData.author, false);
    });

    socket.on("receivePrivateMessage", (messageData: { author: string, content: string }) => {
        addMessage(messageData.content, messageData.author, false);
    });

    // Suggestion de mention @
    let mentionActive = false;
    let mentionStart = -1;
    let filteredSuggestions: string[] = [];
    function updateMentionBox() {
        if (!mentionActive || filteredSuggestions.length === 0) {
            mentionBox!.style.display = "none";
            return;
        }
        mentionBox!.innerHTML = "";
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
                const after = val.slice(input.selectionStart!);
                input.value = before + "@" + username + " " + after;
                mentionBox!.style.display = "none";
                mentionActive = false;
                input.focus();
                // Place le curseur après la mention
                const pos = (before + "@" + username + " ").length;
                input.setSelectionRange(pos, pos);
            };
            mentionBox!.appendChild(item);
        });
        // Positionne la box juste sous l'input, overlay flottant
        const rect = input.getBoundingClientRect();
        mentionBox!.style.left = rect.left + "px";
        mentionBox!.style.top = (rect.bottom + 2) + "px";
        mentionBox!.style.width = rect.width + "px";
        mentionBox!.style.display = "block";
    }

    // Ajout : repositionne la mentionBox lors du resize
    window.addEventListener("resize", () => {
        if (mentionActive && mentionBox!.style.display === "block") {
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
            filteredSuggestions = usernames.filter(u => u.toLowerCase().startsWith(search) && u !== username).slice(0, 8);
            updateMentionBox();
        } else {
            mentionActive = false;
            mentionBox!.style.display = "none";
        }
    });
    // Ferme la box si on clique ailleurs
    document.addEventListener("click", (e) => {
        if (e.target !== input && e.target !== mentionBox) {
            mentionBox!.style.display = "none";
            mentionActive = false;
        }
    });
    // Navigation clavier (flèches + entrée)
    input.addEventListener("keydown", (e) => {
        if (!mentionActive || mentionBox!.style.display === "none") return;
        const items = Array.from(mentionBox!.children) as HTMLDivElement[];
        let idx = items.findIndex(item => item.classList.contains("active"));
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (idx >= 0) items[idx].classList.remove("active");
            idx = (idx + 1) % items.length;
            items[idx].classList.add("active");
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (idx >= 0) items[idx].classList.remove("active");
            idx = (idx - 1 + items.length) % items.length;
            items[idx].classList.add("active");
        } else if (e.key === "Enter" && idx >= 0) {
            e.preventDefault();
            items[idx].click();
        }
    });
}
