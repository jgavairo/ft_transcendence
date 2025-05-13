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
function createChatWidgetHTML() {
    // Bulle flottante + fenêtre de chat masquée
    const widget = document.createElement("div");
    widget.id = "chat-widget";
    widget.innerHTML = `
        <div id="chat-bubble" style="position:fixed;bottom:30px;right:30px;z-index:9999;cursor:pointer;background:#4a90e2;color:#fff;border-radius:50%;width:60px;height:60px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:2rem;">
            💬
        </div>
        <div id="chat-window" style="display:none;position:fixed;bottom:100px;right:30px;width:350px;height:450px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.25);z-index:10000;flex-direction:column;overflow:hidden;">
            <div style="background:#4a90e2;color:#fff;padding:12px 16px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;">
                <span>Chat Communauté</span>
                <button id="close-chat-window" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;">✖</button>
            </div>
            <div id="chatContainer" style="flex:1;overflow-y:auto;padding:10px;background:#f7f7f7;"></div>
            <div style="display:flex;padding:8px;background:#eee;">
                <input id="chatInput" type="text" placeholder="Message..." style="flex:1;padding:8px;border-radius:8px;border:1px solid #ccc;outline:none;" />
                <button id="sendMessage" style="margin-left:8px;padding:8px 12px;background:#4a90e2;color:#fff;border:none;border-radius:8px;cursor:pointer;">Envoyer</button>
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
    chatBubble.onclick = () => { chatWindow.style.display = "flex"; chatBubble.style.display = "none"; };
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
        usernameSpan.style.color = self ? "#4a90e2" : "#222";
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
    if (widget)
        widget.remove();
}
