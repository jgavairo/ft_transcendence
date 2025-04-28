import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
async function fetchCurrentUser() {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/user/infos`, {
            credentials: "include",
        });
        const data = await response.json();
        if (data.success) {
            return data.user.username;
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
async function fetchChatHistory() {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/chat/history`, {
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
export async function setupChat() {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");
    const chatContainer = document.getElementById("chatContainer");
    if (!input || !sendBtn || !chatContainer) {
        console.error("Chat elements not found in the DOM.");
        return;
    }
    // Récupérer les informations des utilisateurs
    const users = await fetchUsernames();
    const userMap = new Map(users.map(user => [user.username, user]));
    const addMessage = (content, author, self = true) => {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `chat-message ${self ? "right" : "left"}`;
        const user = userMap.get(author);
        // Conteneur pour l'image de profil avec effet hover
        const profileContainer = document.createElement("div");
        profileContainer.className = "profile-picture-container";
        // Ajouter la photo de profil
        const profileImg = document.createElement("img");
        profileImg.className = "chat-profile-picture";
        profileImg.src = (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png";
        profileImg.alt = `${author}'s profile picture`;
        // Ajouter la couche de survol
        const overlay = document.createElement("div");
        overlay.className = "profile-picture-overlay";
        const overlayText = document.createElement("span");
        overlayText.textContent = "View";
        overlay.appendChild(overlayText);
        // Ajouter un événement de clic pour afficher la carte de profil
        profileContainer.addEventListener("click", () => {
            showProfileCard((user === null || user === void 0 ? void 0 : user.username) || author, (user === null || user === void 0 ? void 0 : user.profile_picture) || "default-profile.png", (user === null || user === void 0 ? void 0 : user.email) || "Email not available", (user === null || user === void 0 ? void 0 : user.bio) || "No bio available");
        });
        // Ajouter les éléments au conteneur
        profileContainer.appendChild(profileImg);
        profileContainer.appendChild(overlay);
        // Ajouter le conteneur au message
        msgWrapper.appendChild(profileContainer);
        // Ajouter le nom d'utilisateur
        const usernameSpan = document.createElement("span");
        usernameSpan.className = "chat-username";
        usernameSpan.textContent = (user === null || user === void 0 ? void 0 : user.username) || author;
        // Ajouter le contenu du message
        const messageContent = document.createElement("p");
        messageContent.className = "chat-content";
        messageContent.textContent = content;
        // Ajouter les éléments au conteneur du message
        msgWrapper.appendChild(usernameSpan);
        msgWrapper.appendChild(messageContent);
        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
    const username = await fetchCurrentUser();
    if (!username) {
        console.error("Unable to fetch username. Chat will not work properly.");
        return;
    }
    // Charger l'historique des messages
    const chatHistory = await fetchChatHistory();
    chatHistory.forEach(message => {
        const isSelf = message.author === username;
        addMessage(message.content, message.author, isSelf);
    });
    // Connecter le client au serveur socket.IO
    const socket = io('http://127.0.0.1:3000/chat', {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
    });
    socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
    });
    socket.on("error", (error) => {
        console.error("Socket.IO error:", error);
    });
    // Envoyer un message au serveur
    sendBtn.addEventListener("click", () => {
        const text = input.value.trim();
        if (text) {
            socket.emit("sendMessage", { author: username, content: text }, (response) => {
                console.log("Message sent, server response:", response);
            });
            addMessage(text, username, true);
            input.value = "";
        }
    });
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });
    // Recevoir un message du serveur
    socket.on("receiveMessage", (messageData) => {
        if (messageData.author === username) {
            return;
        }
        addMessage(messageData.content, messageData.author, false);
    });
}
