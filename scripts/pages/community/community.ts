import { LoginManager } from '../../managers/loginManager.js';
import { communityPage } from '../../sourcepage.js';
import { renderPeopleList, setupSearchInput } from '../community/peopleList.js';
import { setupChat } from '../community/chat.js';

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

    // Supprimer le widget de chat si présent
    import('./chatWidget.js').then(mod => mod.removeChatWidget());

    renderPeopleList();
    setupSearchInput();
    setupChat();
}