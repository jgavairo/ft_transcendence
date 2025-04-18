export function getCurrentUserName(): string | null {
    const userData = localStorage.getItem("userLibrary");
    if (!userData) return null;

    try {
        const parsed = JSON.parse(userData);
        return parsed.userName;
    } catch (err) {
        console.error("Erreur parsing userLibrary :", err);
        return null;
    }
}

export function setupChat() {
    const input = document.getElementById("chatInput") as HTMLInputElement;
    const sendBtn = document.getElementById("sendMessage") as HTMLButtonElement;
    const chatContainer = document.getElementById("chatContainer");

    if (!input || !sendBtn || !chatContainer) return;

    const addMessage = (content: string, author: string, self = true) => {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `chat-message ${self ? "right" : "left"}`;

        // Créer le texte complet avec @nom + message
        const fullMessage = document.createElement("div");
        fullMessage.innerHTML = `<span style="font-weight:bold; margin-right: 0.5rem; color:#ccc;">@${author} :</span>${content}`;

        msgWrapper.appendChild(fullMessage);

        const chatContainer = document.getElementById("chatContainer");
        if (chatContainer) {
            chatContainer.appendChild(msgWrapper);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    };

    sendBtn.addEventListener("click", () => {
        const text = input.value.trim();
        const author = getCurrentUserName() || "Utilisateur";

        if (text) {
            addMessage(text, author, true);
            input.value = "";
        }
    });

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });
}