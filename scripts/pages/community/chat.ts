import { io } from "socket.io-client";
import { fetchUsernames } from "./peopleList.js";
import { showProfileCard } from "./peopleList.js";
import { HOSTNAME } from "../../main.js";
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
    };

    // Charger l'historique des messages
    const chatHistory = await fetchChatHistory();
    // Affichage de l'historique avec groupement
    let prevAuthor: string | null = null;
    chatHistory.forEach(message => {
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
            canSend = false;
            sendBtn.disabled = true;
            socket.emit("sendMessage", { author: username, content: text }, (response: { success: boolean; error?: string }) => {
                console.log("Message sent, server response:", response);
            });
            addMessage(text, username, true);
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
}

