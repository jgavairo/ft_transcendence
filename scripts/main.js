var _a;
import { storePage, libraryPage, communityPage, header } from "./sourcepage.js";
import { setupHeader, changeActiveButton } from "./header/navigation.js";
import { setupStore } from "./pages/store/store.js";
import api from "./helpers/api.js";
import { LoginManager } from "./managers/loginManager.js";
import { setupChatWidget, removeChatWidget } from "./pages/community/chatWidget.js";
import { showCommunityPage } from "./pages/community/community.js";
import { setupLibrary } from "./pages/library/library.js";
const HOSTNAME = window.location.hostname;
export { HOSTNAME };
export async function updateChatWidgetVisibility() {
    // Utilise l'état de l'historique pour déterminer la page courante
    const currentPage = (window.history.state && window.history.state.page) || 'store';
    if (currentPage === 'community') {
        return;
    }
    if (await LoginManager.isLoggedIn()) {
        setupChatWidget();
    }
    else {
        removeChatWidget();
    }
}
export class MainApp {
    static async init() {
        document.addEventListener('DOMContentLoaded', async () => {
            await this.setupHeader();
            this.setupCurrentPage(false);
            updateChatWidgetVisibility();
        });
    }
    static async setupHeader() {
        const headerElement = document.getElementById('header');
        if (!headerElement) {
            console.error('Header element not found');
            return;
        }
        if (await LoginManager.isLoggedIn()) {
            const userInfos = await this.getUserInfo();
            if (!userInfos) {
                console.error('User infos not found');
                return;
            }
            headerElement.innerHTML = header(userInfos.username, userInfos.profile_picture);
            setupHeader();
        }
        else {
            LoginManager.showLoginModal();
        }
    }
    static setupCurrentPage(forceStore = false) {
        const mainElement = document.getElementById('main');
        if (!mainElement) {
            console.error('Main element not found');
            return;
        }
        if (forceStore) {
            mainElement.innerHTML = storePage;
            setupStore();
            window.history.replaceState({}, '', '/store');
            return;
        }
        const path = window.location.pathname.slice(1) || 'store';
        const storeButton = document.getElementById('storebutton');
        const libraryButton = document.getElementById('librarybutton');
        const communityButton = document.getElementById('communitybutton');
        if (!storeButton || !libraryButton || !communityButton) {
            return;
        }
        let currentActiveButton = document.querySelector('.header .activebutton');
        switch (path) {
            case 'library':
                changeActiveButton(currentActiveButton, libraryButton);
                mainElement.innerHTML = libraryPage;
                setupLibrary();
                break;
            case 'community':
                changeActiveButton(currentActiveButton, communityButton);
                mainElement.innerHTML = communityPage;
                showCommunityPage();
                break;
            default:
                changeActiveButton(currentActiveButton, storeButton);
                mainElement.innerHTML = storePage;
                setupStore();
                break;
        }
    }
}
_a = MainApp;
MainApp.checkAuth = async () => {
    const response = await api.get(`https://${HOSTNAME}:8443/api/auth/check`);
    const text = await response.text();
    const data = JSON.parse(text);
    return data;
};
MainApp.getUserInfo = async () => {
    try {
        const response = await api.get(`https://${HOSTNAME}:8443/api/user/infos`);
        const text = await response.text();
        const data = JSON.parse(text);
        if (data.success) {
            return data.user;
        }
    }
    catch (error) {
        console.error('Erreur:', error);
    }
};
MainApp.init();
