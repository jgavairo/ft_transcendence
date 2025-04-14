import { communityPage } from './sourcepage.js'; // Chemin à adapter si besoin
const STORAGE_KEY = "people";
export function showCommunityPage() {
    const main = document.getElementById("main");
    if (!main)
        return;
    main.innerHTML = communityPage;
    initPeopleList();
    renderPeopleList();
    setupSearchInput();
    setupChat();
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
function renderPeopleList(filter = "") {
    const container = document.getElementById("friendList");
    if (!container) {
        console.error("❌ #friendList introuvable");
        return;
    }
    const friends = getFriendsFromStorage();
    const people = getPeopleFromStorage();
    const filtered = people.filter(name => name.toLowerCase().includes(filter.toLowerCase()));
    // 🔁 On nettoie tout avant de réafficher
    container.innerHTML = "";
    // 💡 On n’utilise pas innerHTML en concat, mais createElement à chaque fois
    filtered.forEach(name => {
        const isFriend = friends.includes(name);
        const div = document.createElement("div");
        div.className = "friend-item";
        const label = document.createElement("span");
        label.className = "friend-name";
        label.textContent = name;
        const button = document.createElement("button");
        button.className = `toggle-button ${isFriend ? "added" : ""}`;
        button.setAttribute("data-name", name);
        button.title = isFriend ? "Supprimer des amis" : "Ajouter comme ami";
        button.textContent = isFriend ? "✖" : "＋";
        button.addEventListener("click", () => {
            const updatedFriends = getFriendsFromStorage();
            if (updatedFriends.includes(name)) {
                removeFriend(name);
                button.textContent = "＋";
                button.classList.remove("added");
                button.title = "Ajouter comme ami";
            }
            else {
                addFriend(name);
                button.textContent = "✖";
                button.classList.add("added");
                button.title = "Supprimer des amis";
            }
        });
        div.appendChild(document.createElement("span")).textContent = "👤";
        div.appendChild(label);
        div.appendChild(button);
        container.appendChild(div);
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
function setupChat() {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendMessage");
    const chatContainer = document.getElementById("chatContainer");
    if (!input || !sendBtn || !chatContainer)
        return;
    const addMessage = (content, self = true) => {
        const msg = document.createElement("div");
        msg.className = `chat-message ${self ? 'right' : 'left'}`;
        msg.textContent = content;
        chatContainer.appendChild(msg);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };
    sendBtn.addEventListener("click", () => {
        const text = input.value.trim();
        if (text) {
            addMessage(text);
            input.value = "";
        }
    });
    // Bonus : envoi avec la touche Entrée
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });
}
