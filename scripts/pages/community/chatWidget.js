// Widget de chat flottant accessible partout
import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
async function fetchCurrentUser() {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/user/infos`, { credentials: "include" });
        const data = await response.json();
        if (data.success)
            return data.user.username;
        return null;
    }
    catch (_a) {
        return null;
    }
}
async function fetchChatHistory() {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/chat/history`, { credentials: "include" });
        const data = await response.json();
        if (data.success)
            return data.messages;
        return [];
    }
    catch (_a) {
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
    // Bulle flottante + fenêtre de chat masquée
    const widget = document.createElement("div");
    widget.id = "chat-widget";
    widget.innerHTML = `
        <style id="chat-widget-style">
            #chat-bubble {
                position:fixed;bottom:30px;right:30px;z-index:9999;cursor:pointer;
                background: linear-gradient(135deg, #23262e 60%, #2a475e 100%);
                color:#66c0f4;border-radius:28px;width:auto;min-width:56px;height:56px;display:flex;align-items:center;justify-content:center;
                box-shadow:0 4px 18px 0 rgba(34, 60, 80, 0.25);
                font-size:2rem;transition:box-shadow 0.2s, background 0.2s, transform 0.15s;
                font-family: 'Segoe UI', Arial, sans-serif;
                border: 2px solid #181a21;
                padding: 0 22px 0 16px;
                gap: 10px;
                animation: chat-bubble-pulse 2.2s infinite;
            }
            @keyframes chat-bubble-pulse {
                0% { box-shadow:0 4px 18px 0 rgba(34,60,80,0.25); transform: scale(1); }
                60% { box-shadow:0 8px 28px 0 #66c0f455; transform: scale(1.06); }
                100% { box-shadow:0 4px 18px 0 rgba(34,60,80,0.25); transform: scale(1); }
            }
            #chat-bubble:hover {
                background: linear-gradient(135deg, #2a475e 60%, #66c0f4 100%);
                box-shadow:0 0 18px #66c0f4cc;
                color: #fff;
                transform: scale(1.08);
            }
            #chat-bubble .chat-bubble-icon {
                display: flex; align-items: center; justify-content: center;
            }
            #chat-bubble .chat-bubble-label {
                font-size: 1.08rem; font-weight: 600; color: #66c0f4;
                margin-left: 7px; letter-spacing: 0.5px;
                display: inline-block;
            }
            @media (max-width: 600px) {
                #chat-bubble .chat-bubble-label { display: none; }
                #chat-bubble { min-width: 56px; padding: 0; }
            }
            #chat-bubble .chat-bubble-badge {
                background: #66c0f4; color: #23262e; font-size: 0.78rem; font-weight: bold;
                border-radius: 8px; padding: 2px 8px; margin-left: 8px;
                box-shadow: 0 1px 4px #0002;
                display: none;
            }
            #chat-window {
                display:none;position:fixed;bottom:100px;right:30px;width:350px;height:440px;
                background: #23262e;
                border-radius:18px;box-shadow:0 2px 12px rgba(34,60,80,0.10);
                z-index:10000;flex-direction:column;overflow:hidden;
                border: 1.5px solid #2a475e;
                font-family: 'Segoe UI', Arial, sans-serif;
                color: #c7d5e0;
            }
            #chat-window .chat-header {
                background: #23262e;
                color:#66c0f4;padding:12px 16px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;
                font-size:1.08rem;letter-spacing:1px;
                border-bottom: 1.5px solid #2a475e;
            }
            #close-chat-window {
                background:none;border:none;color:#66c0f4;font-size:1.2rem;cursor:pointer;
                transition: color 0.2s;
            }
            #close-chat-window:hover {
                color: #fff;
            }
            #chatContainer {
                flex:1;overflow-y:auto;padding:12px 10px 8px 10px;background:transparent;
            }
            #chatInput {
                flex:1;padding:8px 10px;border-radius:6px;border:1px solid #2a475e;outline:none;
                background:#181a21;color:#c7d5e0;font-size:1rem;
                font-family: 'Segoe UI', Arial, sans-serif;
                transition: border 0.2s;
            }
            #chatInput:focus {
                border:1.5px solid #66c0f4;
            }
            #sendMessage {
                margin-left:8px;padding:8px 14px;background:#2a475e;
                color:#c7d5e0;border:none;border-radius:6px;cursor:pointer;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size:1rem;font-weight:500;
                transition: background 0.2s, color 0.2s;
            }
            #sendMessage:hover {
                background:#66c0f4;
                color:#23262e;
            }
            .chat-message-widget {
                margin: 8px 0; display: flex; flex-direction: column;
                max-width: 95%;
            }
            .chat-message-widget.right {
                align-items: flex-end;
            }
            .chat-message-widget.left {
                align-items: flex-start;
            }
            .chat-message-widget .chat-row {
                display: flex; align-items: flex-end;
            }
            .chat-message-widget img {
                width: 28px; height: 28px; border-radius: 6px; margin: 0 7px;
                border: 1px solid #2a475e; background: #23262e;
                cursor: pointer;
                transition: border 0.2s;
            }
            .chat-message-widget img:hover {
                border: 1.5px solid #66c0f4;
            }
            .chat-message-widget .chat-content {
                background: #23262e;
                color: #c7d5e0; border-radius: 12px; padding: 8px 14px; max-width: 220px;
                font-size: 1rem; border: 1px solid #2a475e;
                word-break: break-word;
                transition: background 0.2s, border 0.2s;
            }
            .chat-message-widget.right .chat-content {
                background: #2a475e;
                color: #66c0f4; border: 1px solid #23262e;
            }
            .chat-message-widget .chat-content:hover {
                background: #181a21;
            }
            .chat-message-widget .username {
                font-size: 0.97rem; font-weight: 600; margin-bottom: 1px;
                color: #66c0f4; letter-spacing: 0.5px;
            }
            .chat-message-widget.right .username {
                color: #c7d5e0;
            }
        </style>
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
    if (document.getElementById("chat-widget"))
        return; // déjà présent
    createChatWidgetHTML();
    const chatBubble = document.getElementById("chat-bubble");
    const chatWindow = document.getElementById("chat-window");
    const closeBtn = document.getElementById("close-chat-window");
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");
    const chatContainer = document.getElementById("chatContainer");
    if (!chatBubble || !chatWindow || !closeBtn || !input || !sendBtn || !chatContainer)
        return;
    chatBubble.onclick = () => {
        if (chatWindow.style.display === "flex") {
            chatWindow.style.display = "none";
        }
        else {
            chatWindow.style.display = "flex";
        }
    };
    closeBtn.onclick = () => { chatWindow.style.display = "none"; chatBubble.style.display = "flex"; };
    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.username, user]));
    const addMessage = (content, author, self = true) => {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `chat-message-widget ${self ? "right" : "left"}`;
        msgWrapper.style.display = "flex";
        msgWrapper.style.flexDirection = "column";
        msgWrapper.style.alignItems = self ? "flex-end" : "flex-start";
        msgWrapper.style.margin = "8px 0";
        const user = userMap.get(author);
        // Nom d'utilisateur au-dessus
        const usernameSpan = document.createElement("span");
        usernameSpan.textContent = (user === null || user === void 0 ? void 0 : user.username) || author;
        usernameSpan.style.fontWeight = "bold";
        usernameSpan.style.marginBottom = "2px";
        usernameSpan.style.color = self ? "#4a90e2" : "#66c0f4"; // couleur plus voyante à gauche
        usernameSpan.style.fontSize = "1rem";
        // Ligne message + avatar
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        const profileImg = document.createElement("img");
        profileImg.src = (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png";
        profileImg.alt = `${author}'s profile picture`;
        profileImg.style.width = "32px";
        profileImg.style.height = "32px";
        profileImg.style.borderRadius = "50%";
        profileImg.style.marginRight = "8px";
        profileImg.style.cursor = "pointer";
        profileImg.onclick = () => showProfileCard((user === null || user === void 0 ? void 0 : user.username) || author, (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png", (user === null || user === void 0 ? void 0 : user.email) || "Email not available", (user === null || user === void 0 ? void 0 : user.bio) || "No bio available", (user === null || user === void 0 ? void 0 : user.id) || 0);
        const messageContent = document.createElement("div");
        messageContent.style.background = self ? "#4a90e2" : "#e1e1e1";
        messageContent.style.color = self ? "#fff" : "#222";
        messageContent.style.borderRadius = "12px";
        messageContent.style.padding = "8px 12px";
        messageContent.style.maxWidth = "200px";
        messageContent.textContent = content;
        if (self) {
            row.appendChild(messageContent);
            row.appendChild(profileImg);
        }
        else {
            row.appendChild(profileImg);
            row.appendChild(messageContent);
        }
        msgWrapper.appendChild(usernameSpan);
        msgWrapper.appendChild(row);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
    const username = await fetchCurrentUser();
    if (!username)
        return;
    const chatHistory = await fetchChatHistory();
    chatHistory.forEach((message) => {
        const isSelf = message.author === username;
        addMessage(message.content, message.author, isSelf);
    });
    const socket = io(`http://${HOSTNAME}:3000/chat`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    socket.on("connect", () => { });
    socket.on("connect_error", () => { });
    socket.on("error", () => { });
    sendBtn.addEventListener("click", () => {
        const text = input.value.trim();
        if (text) {
            socket.emit("sendMessage", { author: username, content: text }, () => { });
            addMessage(text, username, true);
            input.value = "";
        }
    });
    input.addEventListener("keydown", e => { if (e.key === "Enter")
        sendBtn.click(); });
    socket.on("receiveMessage", (messageData) => {
        if (messageData.author === username)
            return;
        addMessage(messageData.content, messageData.author, false);
    });
}
export function removeChatWidget() {
    const widget = document.getElementById("chat-widget");
    if (widget) {
        widget.remove();
    }
}
