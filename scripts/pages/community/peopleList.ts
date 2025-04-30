import { HOSTNAME } from "../../main.js";
import { FriendsManager } from "../../managers/friendsManager.js";

const STORAGE_KEY = "people";

export async function fetchUsernames(): Promise<{ username: string, profile_picture: string, email: string, bio: string }[]> {
    try {
        const response = await fetch(`http://${HOSTNAME}:3000/api/users`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            return data.users; // Retourne les utilisateurs avec leurs bios
        } else {
            console.error('Failed to fetch usernames:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching usernames:', error);
        return [];
    }
}

export async function renderPeopleList(filter: string = "") {
    const container = document.getElementById("friendList");
    if (!container) {
        console.error("❌ #friendList introuvable");
        return;
    }

    const friends = getFriendsFromStorage();
    const people = await fetchUsernames();

    // Récupérer l'utilisateur connecté (par exemple, depuis un token ou une API)
    const response = await fetch(`http://${HOSTNAME}:3000/api/user/infos`, {
        credentials: 'include'
    });
    const currentUser = await response.json();
    const currentUsername = currentUser?.user?.username;

    // Filtrer les utilisateurs pour exclure l'utilisateur connecté
    const filtered = people.filter(person =>
        person.username.toLowerCase().includes(filter.toLowerCase()) &&
        person.username !== currentUsername // Exclure l'utilisateur connecté
    );

    container.innerHTML = "";

    filtered.forEach(person => {
        const isFriend = friends.includes(person.username);
    
        const div = document.createElement("div");
        div.className = "friend-item";
    
        // Conteneur pour l'image de profil avec effet hover
        const profileContainer = document.createElement("div");
        profileContainer.className = "profile-picture-container";
    
        // Ajouter l'image de profil
        const img = document.createElement("img");
        img.className = "profile-picture";
        img.src = person.profile_picture || "default-profile.png";
        img.alt = `${person.username}'s profile picture`;
    
        // Ajouter la couche de survol
        const overlay = document.createElement("div");
        overlay.className = "profile-picture-overlay";
    
        const overlayText = document.createElement("span");
        overlayText.textContent = "View";
        overlay.appendChild(overlayText);
    
        // Ajouter un événement pour afficher la carte "profil"
        profileContainer.addEventListener("click", () => {
            showProfileCard(person.username, person.profile_picture, person.email, person.bio);
        });
    
        // Ajouter les éléments au conteneur
        profileContainer.appendChild(img);
        profileContainer.appendChild(overlay);
    
        // Ajouter le conteneur au div principal
        div.appendChild(profileContainer);
    
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
            } else {
                addFriend(person.username);
                button.textContent = "✖";
                button.classList.add("added");
                button.title = "Supprimer des amis";
            }
        });
    
        div.appendChild(label);
        div.appendChild(button);
        container.appendChild(div);
    });
}

export function removeFriend(name: string) {
    const friends = getFriendsFromStorage();
    const updated = friends.filter(friend => friend !== name);
    localStorage.setItem("friends", JSON.stringify(updated));
    console.log(`❌ "${name}" supprimé des amis.`);
}



export function addFriend(name: string) {
    const friends = getFriendsFromStorage();
    if (!friends.includes(name)) {
        friends.push(name);
        localStorage.setItem("friends", JSON.stringify(friends));
        console.log(`✅ "${name}" ajouté aux amis.`);
        FriendsManager.sendFriendRequest(name);
        //add name to attempting_friend_ids
        //add this user to the friend_requests of the other user
    }
}

export function setupSearchInput() {
    const input = document.getElementById("friendSearch") as HTMLInputElement;
    if (!input) return;

    input.addEventListener("input", () => {
        renderPeopleList(input.value);
    });
}

export function getFriendsFromStorage(): string[] {
    return JSON.parse(localStorage.getItem("friends") || "[]");
}

export function showProfileCard(username: string, profilePicture: string, email: string, bio: string) {
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

    // Ajoutez la bio
    const bioElement = document.createElement("p");
    bioElement.className = "profile-card-bio";
    bioElement.textContent = bio || "No bio available";

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
    card.appendChild(bioElement);

    // Ajoutez la carte à l'overlay
    overlay.appendChild(card);

    // Ajoutez l'overlay au body
    document.body.appendChild(overlay);
}
