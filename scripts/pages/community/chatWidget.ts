// Widget de chat flottant accessible partout
import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
import { isBlocked, clearBlockedCache } from "../../helpers/blockedUsers.js";
import { showErrorNotification } from "../../helpers/notifications.js";

async function fetchCurrentUser(): Promise<{ id: number, username: string } | null> {
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/user/infos`, { credentials: "include" });
        const data = await response.json();
        if (data.success) return { id: data.user.id, username: data.user.username };
        return null;
    } catch {
        return null;
    }
}

async function fetchChatHistory(userId: number): Promise<{ author: number, content: string, timestamp?: string }[]> {
    try {
        const response = await fetch(`https://${HOSTNAME}:8443/api/chat/history?userId=${userId}`, { credentials: "include" });
        const data = await response.json();
        if (data.success) return data.messages;
        return [];
    } catch {
        return [];
    }
}

function injectSteamFont() {
    if (!document.getElementById("steam-font")) {
        const link = document.createElement("link");
        link.id = "steam-font";
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;700&display=swap";
        document.head.appendChild(link);
    }
}

function createChatWidgetHTML() {
    injectSteamFont();
    // Inject external CSS for chat widget
    if (!document.getElementById("chat-widget-css")) {
        const link = document.createElement("link");
        link.id = "chat-widget-css";
        link.rel = "stylesheet";
        link.href = "/styles/chatWidget.css";
        document.head.appendChild(link);
    }
    // Bulle flottante + fenêtre de chat masquée
    const widget = document.createElement("div");
    widget.id = "chat-widget";
    widget.innerHTML = `
        <div id="chat-bubble">
            <span class="chat-bubble-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#66c0f4" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <span class="chat-bubble-label">Chat</span>
            <span class="chat-bubble-badge" id="chat-bubble-badge"></span>
        </div>
        <div id="chat-window">
            <div class="chat-header">
                <span>Chat Communauté</span>
                <button id="close-chat-window">✖</button>
            </div>
            <div id="chatContainer"></div>
            <div class="chat-input-container">
                <input id="chatInput" type="text" placeholder="Message..." autocomplete="off" />
                <button id="sendMessage">Envoyer</button>
                <div id="mention-suggestions" class="chat-widget-mention-suggestions-box"></div>
            </div>
        </div>
    `;
    document.body.appendChild(widget);
}

export async function setupChatWidget() {

        // Ajout du conteneur pour la suggestion d'utilisateurs
    let mentionBox = document.getElementById("mention-suggestions");
    if (!mentionBox) {
        mentionBox = document.createElement("div");
        mentionBox.id = "mention-suggestions";
        mentionBox.className = "chat-widget-mention-suggestions-box";
        // Ajoute la box à body pour overlay flottant
        document.body.appendChild(mentionBox);
    }

    if (document.getElementById("chat-widget")) return; // déjà présent
    createChatWidgetHTML();
    const chatBubble = document.getElementById("chat-bubble");
    const chatWindow = document.getElementById("chat-window");
    const closeBtn = document.getElementById("close-chat-window");
    const input = document.getElementById("chatInput") as HTMLInputElement;
    input.maxLength = 300; // Limite de caractères côté HTML
    const sendBtn = document.getElementById("sendMessage") as HTMLButtonElement;
    const chatContainer = document.getElementById("chatContainer");
    const chatBubbleBadge = document.getElementById("chat-bubble-badge") as HTMLSpanElement;
    let unreadCount = 0;

    function showBadge() {
        if (chatBubbleBadge) {
            chatBubbleBadge.textContent = unreadCount > 0 ? unreadCount.toString() : "";
            chatBubbleBadge.style.display = unreadCount > 0 ? "inline-block" : "none";
        }
    }
    function resetBadge() {
        unreadCount = 0;
        showBadge();
    }

    if (!chatBubble || !chatWindow || !closeBtn || !input || !sendBtn || !chatContainer) return;

    chatBubble.onclick = () => {
        if (chatWindow.style.display === "flex") {
            chatWindow.style.display = "none";
        } else {
            chatWindow.style.display = "flex";
            chatContainer.scrollTop = chatContainer.scrollHeight;
            resetBadge();
        }
    };
    closeBtn.onclick = () => { chatWindow.style.display = "none"; chatBubble.style.display = "flex"; };

    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.id, user]));
    const usernames = users.map(u => u.username);
    let lastAuthor: number | null = null;
    let lastMsgWrapper: HTMLDivElement | null = null;

    const addMessage = (content: string, authorIdRaw: number|string, self = true) => {
        const authorId = Number(authorIdRaw);
        const isGrouped = lastAuthor === authorId;
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `chat-widget-messenger-message-wrapper${self ? " self" : ""}${isGrouped ? " grouped" : ""}`;
        if (!self && !isGrouped) {
            const user = userMap.get(authorId);
            const usernameSpan = document.createElement("span");
            usernameSpan.textContent = user?.username || `User#${authorId}`;
            usernameSpan.className = `chat-widget-messenger-username`;
            msgWrapper.appendChild(usernameSpan);
        }
        const row = document.createElement("div");
        row.className = "chat-widget-messenger-message-row";
        if (!self && !isGrouped) {
            const user = userMap.get(authorId);
            const profileImg = document.createElement("img");
            profileImg.src = user?.profile_picture || "default-profile.png";
            profileImg.alt = `${user?.username || authorId}'s profile picture`;
            profileImg.className = "chat-widget-messenger-avatar";
            profileImg.onclick = () => showProfileCard(user?.username || `User#${authorId}`, user?.profile_picture || "default-profile.png", user?.email || "Email not available", user?.bio || "No bio available", user?.id || 0);
            row.appendChild(profileImg);
        } else {
            const spacer = document.createElement("div");
            spacer.className = "chat-widget-messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        const messageContent = document.createElement("div");
        let mentionMatch = content.match(/^@(\w+)/);
        let mentionClass = (!self && mentionMatch) ? " chat-widget-messenger-bubble-mention" : "";
        if (mentionMatch) {
            // Cherche l'utilisateur mentionné pour afficher son nom et sa photo
            const mentionedUser = users.find(u => u.username === mentionMatch[1]);
            if (mentionedUser) {
                messageContent.innerHTML = content.replace(
                    /^@(\w+)/,
                    `<span class="chat-widget-mention">@${mentionedUser.username}</span>`
                );
            } else {
                messageContent.innerHTML = content.replace(
                    /^@(\w+)/,
                    '<span class="chat-widget-mention">@$1</span>'
                );
            }
        } else {
            messageContent.textContent = content;
        }
        messageContent.className = `chat-widget-messenger-bubble${self ? " self" : ""}${mentionClass}`;
        row.appendChild(messageContent);
        msgWrapper.appendChild(row);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        lastAuthor = authorId;
        lastMsgWrapper = msgWrapper;
    };
    const currentUser = await fetchCurrentUser();
    if (!currentUser) return;

    // Charger l'historique des messages
    const chatHistory = await fetchChatHistory(currentUser.id);
    // Affichage de l'historique avec groupement
    let prevAuthor: number | null = null;
    for (const message of chatHistory) {
        const isSelf = message.author === currentUser.id;
        if (!isSelf && await isBlocked(userMap.get(message.author)?.username || "")) continue;
        addMessage(message.content, message.author, isSelf);
    }
    const socket = io(`https://${HOSTNAME}:8443/chat`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
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
    sendBtn.addEventListener("click", async () => {
        if (!canSend) return;
        const currentUser = await fetchCurrentUser();
        if (!currentUser) {
            if (chatContainer) chatContainer.innerHTML = "<div class='chat-error'>Vous avez été déconnecté. Merci de vous reconnecter pour utiliser le chat.</div>";
            if (input) input.style.display = 'none';
            if (sendBtn) sendBtn.style.display = 'none';
            return;
        }
        const text = input.value.trim();
        if (!text || text.length === 0 || text.length > 300) {
            input.value = text.slice(0, 300); // Tronque si besoin
            return;
        }
        canSend = false;
        sendBtn.disabled = true;
        const mentionMatch = text.match(/^@(\w+)/);
        if (mentionMatch) {
            const targetUser = users.find(u => u.username === mentionMatch[1]);
            if (!targetUser) {
                showErrorNotification("User not found");
                canSend = true;
                sendBtn.disabled = false;
                return;
            }
            socket.emit("sendPrivateMessage", { to: String(targetUser.id), author: String(currentUser.id), content: text }, (response: { success: boolean; error?: string }) => {});
            addMessage(text, currentUser.id, true);
        } else {
            socket.emit("sendMessage", { author: String(currentUser.id), content: text }, (response: { success: boolean; error?: string }) => {});
            addMessage(text, currentUser.id, true);
        }
        input.value = "";
        setTimeout(() => {
            canSend = true;
            sendBtn.disabled = false;
        }, COOLDOWN_MS);
    });
    input.addEventListener("input", () => {
        if (input.value.length > 300) {
            input.value = input.value.slice(0, 300);
        }
    });
    input.addEventListener("keydown", e => { if (e.key === "Enter") sendBtn.click(); });
    socket.on("receiveMessage", async (messageData: { author: number|string, content: string }) => {
        const authorId = Number(messageData.author);
        if (authorId === currentUser.id) return;
        if (await isBlocked(userMap.get(authorId)?.username || "")) return;
        if (!userMap.has(authorId)) {
            const newUsers = await fetchUsernames();
            userMap.clear();
            newUsers.forEach(user => userMap.set(user.id, user));
        }
        addMessage(messageData.content, authorId, false);
        if (chatWindow.style.display !== "flex") {
            unreadCount++;
            showBadge();
        }
    });
    socket.on("receivePrivateMessage", async (messageData: { author: number|string, content: string }) => {
        const authorId = Number(messageData.author);
        if (await isBlocked(userMap.get(authorId)?.username || "")) return;
        if (!userMap.has(authorId)) {
            const newUsers = await fetchUsernames();
            userMap.clear();
            newUsers.forEach(user => userMap.set(user.id, user));
        }
        addMessage(messageData.content, authorId, false);
        if (chatWindow.style.display !== "flex") {
            unreadCount++;
            showBadge();
        }
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
             item.className = "chat-widget-mention-suggestion-item";
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
             filteredSuggestions = usernames.filter(u => u.toLowerCase().startsWith(search) && u !== currentUser.username).slice(0, 8);
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

    // Ajout : repositionne la mentionBox lors du resize
    window.addEventListener("resize", () => {
        if (mentionActive && mentionBox!.style.display === "block") {
            updateMentionBox();
        }
    });
    
    // Vider le cache partagé au début de setupChatWidget
    // Vider le cache partagé au début de setupChatWidget
    clearBlockedCache();
    handleGameInviteLinkForWidget();
}

// Gestion des liens d'invitation Pong pour le chat widget flottant
export function handleGameInviteLinkForWidget() {
    document.addEventListener('click', async function (e) {
        const target = e.target as HTMLElement | null;
        if (target && target.tagName === 'A' && (target as HTMLAnchorElement).href && (target as HTMLAnchorElement).href.includes('/pong/join?room=')) {
            e.preventDefault();
            // Extraire l'ID de la room depuis l'URL
            const url = new URL((target as HTMLAnchorElement).href);
            const roomId = url.searchParams.get('room');
            if (!roomId) return;
            // Vérifier si la room existe avant d'ouvrir le modal
            try {
                const resp = await fetch(`/api/pong/room-exists?roomId=${encodeURIComponent(roomId)}`, { credentials: "include" });
                const data = await resp.json();
                if (!data.success || !data.exists) {
                    return;
                }
            } catch (err) {
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
            document.getElementById('closeGameModal')!.onclick = () => { modal!.innerHTML = ''; };
            // Appel la fonction centralisée pour lancer Pong via le lien
            const { launchPongFromLink } = await import('../../games/pong/main.js');
            launchPongFromLink(roomId);
        }
    });
}

export function removeChatWidget() {
    const widget = document.getElementById("chat-widget");
    if (widget) {
        widget.remove();
    }
    // Optionally remove mention box if present
    const mentionBox = document.getElementById("mention-suggestions");
    if (mentionBox) {
        mentionBox.remove();
    }
}
