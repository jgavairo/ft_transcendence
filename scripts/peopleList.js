var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const STORAGE_KEY = "people";
export function fetchUsernames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('http://127.0.0.1:3000/api/users', {
                credentials: 'include'
            });
            const data = yield response.json();
            if (data.success) {
                return data.users; // Retourne les utilisateurs avec leurs emails
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
export function initPeopleList() {
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
export function renderPeopleList() {
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
            img.addEventListener("click", () => {
                showProfileCard(person.username, person.profile_picture, person.email);
            });
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
export function removeFriend(name) {
    const friends = getFriendsFromStorage();
    const updated = friends.filter(friend => friend !== name);
    localStorage.setItem("friends", JSON.stringify(updated));
    console.log(`❌ "${name}" supprimé des amis.`);
}
export function addFriend(name) {
    const friends = getFriendsFromStorage();
    if (!friends.includes(name)) {
        friends.push(name);
        localStorage.setItem("friends", JSON.stringify(friends));
        console.log(`✅ "${name}" ajouté aux amis.`);
    }
}
export function setupSearchInput() {
    const input = document.getElementById("friendSearch");
    if (!input)
        return;
    input.addEventListener("input", () => {
        renderPeopleList(input.value);
    });
}
export function getFriendsFromStorage() {
    return JSON.parse(localStorage.getItem("friends") || "[]");
}
export function showProfileCard(username, profilePicture, email) {
    // Vérifiez si une carte existe déjà et la supprimez
    let existingCard = document.getElementById("profileOverlay");
    if (existingCard) {
        existingCard.remove();
    }
    // Créez un overlay
    const overlay = document.createElement("div");
    overlay.id = "profileOverlay";
    overlay.className = "profile-overlay";
    // Ajoutez un événement pour fermer la carte lorsqu'on clique en dehors
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.remove();
        }
    });
    // Créez une nouvelle carte
    const card = document.createElement("div");
    card.id = "profileCard";
    card.className = "profile-card";
    // Ajoutez l'image de profil
    const img = document.createElement("img");
    img.className = "profile-card-picture";
    img.src = profilePicture || "default-profile.png";
    img.alt = `${username}'s profile picture`;
    // Ajoutez le nom d'utilisateur
    const name = document.createElement("h3");
    name.className = "profile-card-name";
    name.textContent = username;
    // Ajoutez l'email
    const emailElement = document.createElement("p");
    emailElement.className = "profile-card-email";
    emailElement.textContent = `Email: ${email}`;
    // Ajoutez un bouton pour fermer la carte
    const closeButton = document.createElement("button");
    closeButton.className = "profile-card-close";
    closeButton.textContent = "✖";
    closeButton.addEventListener("click", () => {
        overlay.remove();
    });
    // Ajoutez les éléments à la carte
    card.appendChild(closeButton);
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(emailElement);
    // Ajoutez la carte à l'overlay
    overlay.appendChild(card);
    // Ajoutez l'overlay au body
    document.body.appendChild(overlay);
}
