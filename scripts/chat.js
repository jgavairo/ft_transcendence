var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { io } from "socket.io-client";
function fetchCurrentUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch("http://127.0.0.1:3000/api/header", {
                credentials: "include", // Inclure les cookies pour l'authentification
            });
            const data = yield response.json();
            if (data.success) {
                return data.username; // Retourne le nom d'utilisateur
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
    });
}
export function setupChat() {
    return __awaiter(this, void 0, void 0, function* () {
        const input = document.getElementById("chatInput");
        const sendBtn = document.getElementById("sendMessage");
        const chatContainer = document.getElementById("chatContainer");
        if (!input || !sendBtn || !chatContainer) {
            console.error("Chat elements not found in the DOM.");
            return;
        }
        // Récupérer le nom d'utilisateur depuis la base de données
        const username = yield fetchCurrentUser();
        if (!username) {
            console.error("Unable to fetch username. Chat will not work properly.");
            return;
        }
        // Connecter le client au serveur Socket.IO
        const socket = io("http://127.0.0.1:3000");
        socket.on("connect", () => {
            console.log("Connected to Socket.IO server");
        });
        const addMessage = (content, author, self = true) => {
            const msgWrapper = document.createElement("div");
            msgWrapper.className = `chat-message ${self ? "right" : "left"}`;
            // Ajouter le nom d'utilisateur après le @
            const fullMessage = document.createElement("div");
            fullMessage.innerHTML = `<span style="font-weight:bold; margin-right: 0.5rem; color:#ffff;">@${author} :</span>${content}`;
            msgWrapper.appendChild(fullMessage);
            chatContainer.appendChild(msgWrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        };
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
        socket.on("receiveMessage", (messageData) => {
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
    });
}
