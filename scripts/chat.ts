import { io } from "socket.io-client";

async function fetchCurrentUser(): Promise<string | null> {
    try {
        const response = await fetch("http://127.0.0.1:3000/api/header", {
            credentials: "include", // Inclure les cookies pour l'authentification
        });
        const data = await response.json();
        if (data.success) {
            return data.username; // Retourne le nom d'utilisateur
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
        const response = await fetch("http://127.0.0.1:3000/api/chat/history", {
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

    if (!input || !sendBtn || !chatContainer) {
        console.error("Chat elements not found in the DOM.");
        return;
    }

    // Déclarez la fonction addMessage avant de l'utiliser
    const addMessage = (content: string, author: string, self = true) => {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `chat-message ${self ? "right" : "left"}`;

        // Ajouter le nom d'utilisateur après le @
        const fullMessage = document.createElement("div");
        fullMessage.innerHTML = `<span style="font-weight:bold; margin-right: 0.5rem; color:#ffff;">@${author} :</span>${content}`;

        msgWrapper.appendChild(fullMessage);

        chatContainer.appendChild(msgWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // Récupérer le nom d'utilisateur depuis la base de données
    const username = await fetchCurrentUser();
    if (!username) {
        console.error("Unable to fetch username. Chat will not work properly.");
        return;
    }

    // Charger l'historique des messages
    const chatHistory = await fetchChatHistory();
    chatHistory.forEach(message => {
        // Vérifier si le message a été envoyé par l'utilisateur connecté
        const isSelf = message.author === username;
        addMessage(message.content, message.author, isSelf);
    });

    // Connecter le client au serveur Socket.IO
    const socket = io("http://127.0.0.1:3000");

    socket.on("connect", () => {
        console.log("Connected to Socket.IO server");
    });

    // Envoyer un message au serveur
    sendBtn.addEventListener("click", () => {
        const text = input.value.trim();

        if (text) {
            socket.emit("sendMessage", { author: username, content: text }); // Envoyer au serveur
            addMessage(text, username, true); // Ajouter localement
            input.value = "";
        }
    });

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });

    // Recevoir un message du serveur
    socket.on("receiveMessage", (messageData: { author: string, content: string, senderId: string }) => {
        // Vérifier si le message provient de l'utilisateur lui-même
        if (messageData.senderId === socket.id) {
            return; // Ne pas afficher le message
        }

        addMessage(messageData.content, messageData.author, false); // Ajouter un message reçu
    });

    // Gestion des erreurs de connexion
    socket.on("connect_error", (err) => {
        console.error("Socket.IO connection error:", err);
    });
}