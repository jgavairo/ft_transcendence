import { LoginManager } from './loginModal.js';
import { communityPage } from './sourcepage.js';
import { initPeopleList, renderPeopleList, setupSearchInput } from './peopleList.js';
import { setupChat } from './chat.js';

export async function showCommunityPage() {
    if (!await LoginManager.isLoggedIn()) {
        console.log("Not logged in, showing login modal");
        LoginManager.showLoginModal();
        return;
    } else {
        console.log("Logged in, showing community");
    }

    const main = document.getElementById("main");
    if (!main) return;

    main.innerHTML = communityPage;

    initPeopleList();
    renderPeopleList();
    setupSearchInput();
    setupChat();
}