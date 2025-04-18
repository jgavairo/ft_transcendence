var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LoginManager } from './loginModal.js';
import { communityPage } from './sourcepage.js'; // Chemin à adapter si besoin
const STORAGE_KEY = "people";
export function showCommunityPage() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield LoginManager.isLoggedIn())) {
            console.log("Not logged in, showing login modal");
            LoginManager.showLoginModal();
            return;
        }
        else
            console.log("Logged in, showing community");
        const main = document.getElementById("main");
        if (!main)
            return;
        main.innerHTML = communityPage;
        initPeopleList();
        renderPeopleList();
        setupSearchInput();
        setupChat();
    });
}
function fetchUsernames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('http://127.0.0.1:3000/api/users', {
                credentials: 'include'
            });
            const data = yield response.json();
            if (data.success) {
                return data.users; // Retourne les utilisateurs avec leurs photos de profil
            }
            else {
                console.error('Failed to fetch usernames:', data.message);
                return [];
            }
        }
        catch (error) {
            console.error('Error fetching usernames:', error);
            return [];
        }
    });
}
/**
 * Initialise la liste "people" dans localStorage si elle n'existe pas
 */
function initPeopleList() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        const defaultPeople = [
            "Xx-ZeNiTsU-xX",
            "FrancisLeTordu",
            "Jordanlebucheron",
            "Jordictateur",
            "Goboulle",
            "LilixLePredateur",
            "PlusDeBatrique",
            "GOAT_LPR"
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPeople));
    }
}
/**
 * Affiche la liste filtrée dans #friendList
 */
function renderPeopleList() {
    return __awaiter(this, arguments, void 0, function* (filter = "") {
        const container = document.getElementById("friendList");
        if (!container) {
            console.error("❌ #friendList introuvable");
            return;
        }
        const friends = getFriendsFromStorage();
        const people = yield fetchUsernames(); // Récupère les utilisateurs avec leurs photos de profil
        const filtered = people.filter(person => person.username.toLowerCase().includes(filter.toLowerCase()));
        container.innerHTML = "";
        filtered.forEach(person => {
            const isFriend = friends.includes(person.username);
            const div = document.createElement("div");
            div.className = "friend-item";
            // Ajouter l'image de profil
            const img = document.createElement("img");
            img.className = "profile-picture";
            img.src = person.profile_picture || "default-profile.png"; // Utiliser une image par défaut si aucune photo n'est disponible
            img.alt = `${person.username}'s profile picture`;
            const label = document.createElement("span");
            label.className = "friend-name";
            label.textContent = person.username;
            const button = document.createElement("button");
            button.className = `toggle-button ${isFriend ? "added" : ""}`;
            button.setAttribute("data-name", person.username);
            button.title = isFriend ? "Supprimer des amis" : "Ajouter comme ami";
            button.textContent = isFriend ? "✖" : "＋";
            button.addEventListener("click", () => {
                const updatedFriends = getFriendsFromStorage();
                if (updatedFriends.includes(person.username)) {
                    removeFriend(person.username);
                    button.textContent = "＋";
                    button.classList.remove("added");
                    button.title = "Ajouter comme ami";
                }
                else {
                    addFriend(person.username);
                    button.textContent = "✖";
                    button.classList.add("added");
                    button.title = "Supprimer des amis";
                }
            });
            div.appendChild(img); // Ajouter l'image de profil
            div.appendChild(label);
            div.appendChild(button);
            container.appendChild(div);
        });
    });
}
function removeFriend(name) {
    const friends = getFriendsFromStorage();
    const updated = friends.filter(friend => friend !== name);
    localStorage.setItem("friends", JSON.stringify(updated));
    console.log(`❌ "${name}" supprimé des amis.`);
}
function addFriend(name) {
    const friends = getFriendsFromStorage();
    if (!friends.includes(name)) {
        friends.push(name);
        localStorage.setItem("friends", JSON.stringify(friends));
        console.log(`✅ "${name}" ajouté aux amis.`);
    }
}
/**
 * Connecte l'input de recherche à la fonction de rendu
*/
function setupSearchInput() {
    const input = document.getElementById("friendSearch");
    if (!input)
        return;
    input.addEventListener("input", () => {
        renderPeopleList(input.value);
    });
}
/**
 * Récupère la liste depuis localStorage
*/
function getPeopleFromStorage() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}
function getFriendsFromStorage() {
    return JSON.parse(localStorage.getItem("friends") || "[]");
}
// Récupérer le nom d'utilisateur actuel depuis le localStorage
function getCurrentUserName() {
    const userData = localStorage.getItem("userLibrary");
    if (!userData)
        return null;
    try {
        const parsed = JSON.parse(userData);
        return parsed.userName;
    }
    catch (err) {
        console.error("Erreur parsing userLibrary :", err);
        return null;
    }
}
function setupChat() {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");
    const chatContainer = document.getElementById("chatContainer");
    if (!input || !sendBtn || !chatContainer)
        return;
    const addMessage = (content, author, self = true) => {
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
