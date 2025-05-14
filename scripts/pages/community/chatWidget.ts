// Widget de chat flottant accessible partout
import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";

async function fetchCurrentUser(): Promise<string | null> {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/user/infos`, { credentials: "include" });
        const data = await response.json();
        if (data.success) return data.user.username;
        return null;
    } catch {
        return null;
    }
}

async function fetchChatHistory(): Promise<{ author: string, content: string, timestamp?: string }[]> {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/chat/history`, { credentials: "include" });
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
        </div>
        <div id="chat-window">
            <div class="chat-header">
                <span>Chat Communauté</span>
                <button id="close-chat-window">✖</button>
            </div>
            <div id="chatContainer"></div>
            <div style="display:flex;padding:9px 10px 9px 10px;background:#23262e;border-top:1.5px solid #2a475e;">
                <input id="chatInput" type="text" placeholder="Message..." autocomplete="off" />
                <button id="sendMessage">Envoyer</button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);
}

export async function setupChatWidget() {
    if (document.getElementById("chat-widget")) return; // déjà présent
    createChatWidgetHTML();
    const chatBubble = document.getElementById("chat-bubble");
    const chatWindow = document.getElementById("chat-window");
    const closeBtn = document.getElementById("close-chat-window");
    const input = document.getElementById("chatInput") as HTMLInputElement;
    input.maxLength = 300; // Limite de caractères côté HTML
    const sendBtn = document.getElementById("sendMessage") as HTMLButtonElement;
    const chatContainer = document.getElementById("chatContainer");
    if (!chatBubble || !chatWindow || !closeBtn || !input || !sendBtn || !chatContainer) return;

    chatBubble.onclick = () => {
        if (chatWindow.style.display === "flex") {
            chatWindow.style.display = "none";
        } else {
            chatWindow.style.display = "flex";
        }
    };
    closeBtn.onclick = () => { chatWindow.style.display = "none"; chatBubble.style.display = "flex"; };

    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.username, user]));
    let lastAuthor: string | null = null;
    let lastMsgWrapper: HTMLDivElement | null = null;
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
        // Affiche la photo uniquement pour les messages reçus et seulement pour le premier message du groupe
        if (!self && !isGrouped) {
            const user = userMap.get(author);
            const profileImg = document.createElement("img");
            profileImg.src = user?.profile_picture || "default-profile.png";
            profileImg.alt = `${author}'s profile picture`;
            profileImg.className = "messenger-avatar";
            profileImg.onclick = () => showProfileCard(user?.username || author, user?.profile_picture || "default-profile.png", user?.email || "Email not available", user?.bio || "No bio available", user?.id || 0);
            row.appendChild(profileImg);
        } else {
            const spacer = document.createElement("div");
            spacer.className = "messenger-avatar-spacer";
            row.appendChild(spacer);
        }
        const messageContent = document.createElement("div");
        messageContent.className = `messenger-bubble${self ? " self" : ""}`;
        messageContent.textContent = content;
        row.appendChild(messageContent);
        msgWrapper.appendChild(row);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        lastAuthor = author;
        lastMsgWrapper = msgWrapper;
    };
    const username = await fetchCurrentUser();
    if (!username) return;
    const chatHistory = await fetchChatHistory();
    let prevAuthor: string | null = null;
    chatHistory.forEach((message: { author: string, content: string }, idx: number) => {
        const isSelf = message.author === username;
        addMessage(message.content, message.author, isSelf);
        prevAuthor = message.author;
    });
    const socket = io(`http://${HOSTNAME}:3000/chat`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    socket.on("connect", () => {});
    socket.on("connect_error", () => {});
    socket.on("error", () => {});
    sendBtn.addEventListener("click", () => {
        const text = input.value.trim();
        if (!text || text.length === 0 || text.length > 300) {
            input.value = text.slice(0, 300); // Tronque si besoin
            return;
        }
        socket.emit("sendMessage", { author: username, content: text }, () => {});
        addMessage(text, username, true);
        input.value = "";
    });
    input.addEventListener("input", () => {
        if (input.value.length > 300) {
            input.value = input.value.slice(0, 300);
        }
    });
    input.addEventListener("keydown", e => { if (e.key === "Enter") sendBtn.click(); });
    socket.on("receiveMessage", (messageData: { author: string, content: string }) => {
        if (messageData.author === username) return;
        addMessage(messageData.content, messageData.author, false);
    });
}

export function removeChatWidget() {
    const widget = document.getElementById("chat-widget");
    if (widget) {
        widget.remove();
    }
}
