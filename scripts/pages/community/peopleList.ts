import { showErrorNotification, showNotification } from "../../helpers/notifications.js";
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
    const communityButton = document.getElementById('communitybutton');
    if (!communityButton?.classList.contains('activebutton')) {
        console.log('Not in community page, skipping renderPeopleList');
        return;
    }

    const container = document.getElementById("friendList");
    if (!container) {
        console.error("❌ #friendList introuvable");
        return;
    }

    try {
        const people = await fetchUsernames();
        const response = await fetch(`http://${HOSTNAME}:3000/api/user/infos`, {
            credentials: 'include'
        });
        const currentUser = await response.json();
        const currentUsername = currentUser?.user?.username;

        const filtered = people.filter(person =>
            person.username.toLowerCase().includes(filter.toLowerCase()) &&
            person.username !== currentUsername
        );

        // Nettoyer le conteneur (supprime tous les event listeners)
        container.innerHTML = "";

        // Rendre tous les éléments en une seule fois
        await Promise.all(filtered.map(async (person) => {
            const isFriend = await FriendsManager.isFriend(person.username);
            let isRequesting = false;
            let isRequested = false;
            if (!isFriend) {
                isRequesting = await FriendsManager.isRequesting(person.username);
                if (!isRequesting) {
                    isRequested = await FriendsManager.isRequested(person.username);
                }
            }

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
            const button2 = document.createElement("button");

            if (isFriend) {
                button.className = "toggle-button added";
                button.title = "Delete friend";
                button.textContent = "✖";
            } else if (isRequesting) {
                button.className = "toggle-button requesting";
                button.title = "Requesting - Cancel request";
                button.textContent = "⌛";
            } else if (isRequested) {
                button.className = "toggle-button requested";
                button.title = "Accept request";
                button.textContent = "✓";
                button2.className = "toggle-button refused";
                button2.title = "Refuse request";
                button2.textContent = "✖";
            } else {
                button.className = "toggle-button";
                button.title = "Add friend";
                button.textContent = "＋";
            }

            button.setAttribute("data-name", person.username);
            
            if (isRequested) {
                button2.addEventListener("click", async () => {
                    await refuseFriendRequest(person.username);
                    await renderPeopleList();
                });
            }

            button.addEventListener("click", async () => {
                if (isFriend) {
                    await removeFriend(person.username);
                } else if (isRequesting) {
                    await cancelFriendRequest(person.username);
                } else if (isRequested) {
                    await acceptFriendRequest(person.username);
                } else {
                    await addFriend(person.username);
                }
                await renderPeopleList();
            });

            div.appendChild(label);
            div.appendChild(button);
            div.appendChild(button2);
            container.appendChild(div);
        }));
    } catch (error) {
        console.error("Error in renderPeopleList:", error);
    }
}

export async function refuseFriendRequest(name: string)
{
    console.log('Refusing friend request from:', name);
    const success = await FriendsManager.refuseFriendRequest(name);
    if (success) {
        console.log('Friend request refused successfully');
        showNotification("Friend request from " + name + " has been refused");
    } else {
        console.error('Failed to refuse friend request');
        showErrorNotification("Failed to refuse friend request");
    }
}

export async function cancelFriendRequest(name: string)
{
    console.log('Cancelling friend request to:', name);
    const success = await FriendsManager.cancelFriendRequest(name);
    if (success) {
        console.log("Friend request cancelled successfully");
        showNotification(name + " is no longer requesting to be your friend");
        return true;
    } 
    else 
    {
        console.error("Failed to cancel friend request");
        showErrorNotification("Failed to cancel friend request");
        return false;
    }
}

export async function removeFriend(name: string) 
{
    try {
        console.log("removeFriend: " + name);
        const success = await FriendsManager.removeFriend(name);
        if (success) {
            console.log("Friend removed successfully");
            showNotification(name + " is no longer your friend");
            return true;
        } 
        else 
        {
            console.error("Failed to remove friend");
            showErrorNotification("Failed to remove friend");
            return false;
        }
    } catch (error) {
        console.error("Error in removeFriend:", error);
        return false;
    }
}

export async function acceptFriendRequest(name: string)
{
    try {
        console.log('Accepting friend request from:', name);
        const success = await FriendsManager.acceptFriendRequest(name);
        if (success) 
        {
            showNotification(name + " is now your friend");
        }
        else
        {
            showErrorNotification("Failed to accept friend request");
        }
    }
    catch (error)
    {
        console.error("Error in acceptFriendRequest:", error);
        showErrorNotification("Failed to accept friend request");
    }
}

export async function addFriend(name: string) 
{
    const success = await FriendsManager.sendFriendRequest(name);
    if (success)
        showNotification(name + " is now requesting to be your friend");
    else
        showErrorNotification("Failed to send friend request");
}

export function setupSearchInput() {
    const input = document.getElementById("friendSearch") as HTMLInputElement;
    if (!input) return;

    input.addEventListener("input", () => {
        renderPeopleList(input.value);
    });
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
