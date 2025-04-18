import { LoginManager } from './loginModal.js';
import { communityPage } from './sourcepage.js'; // Chemin à adapter si besoin

const STORAGE_KEY = "people";

export async function showCommunityPage() 
{
	if(!await LoginManager.isLoggedIn())
		{
			console.log("Not logged in, showing login modal");
			LoginManager.showLoginModal();
			return;
		}
		else 
			console.log("Logged in, showing community");
	const main = document.getElementById("main");
	if (!main) return;

	main.innerHTML = communityPage;

	initPeopleList();
	renderPeopleList();
	setupSearchInput();
	setupChat();
}

async function fetchUsernames(): Promise<string[]> {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/users', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            return data.usernames; // La liste des noms d'utilisateur sans l'utilisateur en cours
        } else {
            console.error('Failed to fetch usernames:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching usernames:', error);
        return [];
    }
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
async function renderPeopleList(filter: string = "") {
    const container = document.getElementById("friendList");
    if (!container) {
        console.error("❌ #friendList introuvable");
        return;
    }

    const friends = getFriendsFromStorage();
    const people = await fetchUsernames(); // Récupère les usernames depuis l'API

    const filtered = people.filter(name =>
        name.toLowerCase().includes(filter.toLowerCase())
    );

    container.innerHTML = "";

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
            } else {
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

function removeFriend(name: string) {
	const friends = getFriendsFromStorage();
	const updated = friends.filter(friend => friend !== name);
	localStorage.setItem("friends", JSON.stringify(updated));
	console.log(`❌ "${name}" supprimé des amis.`);
}

function addFriend(name: string) {
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
	const input = document.getElementById("friendSearch") as HTMLInputElement;
	if (!input) return;
	
	input.addEventListener("input", () => {
		renderPeopleList(input.value);
	});
}

/**
 * Récupère la liste depuis localStorage
*/
function getPeopleFromStorage(): string[] {
	return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function getFriendsFromStorage(): string[] {
	return JSON.parse(localStorage.getItem("friends") || "[]");
}

// Récupérer le nom d'utilisateur actuel depuis le localStorage
function getCurrentUserName(): string | null {
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
  
  function setupChat() {
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