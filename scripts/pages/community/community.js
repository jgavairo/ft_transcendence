import { LoginManager } from '../../managers/loginManager.js';
import { communityPage } from '../../sourcepage.js';
import { renderPeopleList, setupSearchInput } from '../community/peopleList.js';
import { setupChat } from '../community/chat.js';
export async function showCommunityPage() {
    if (!await LoginManager.isLoggedIn()) {
        LoginManager.showLoginModal();
        return;
    }
    const main = document.getElementById("main");
    if (!main)
        return;
    main.innerHTML = ""; // Empty the container before injecting the community page
    main.innerHTML = communityPage;
    // Remove the chat widget if present
    import('./chatWidget.js').then(mod => mod.removeChatWidget());
    renderPeopleList();
    setupSearchInput();
    setupChat();
}
