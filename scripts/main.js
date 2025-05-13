var _a;
import { storePage, header } from "./sourcepage.js";
import { setupHeader } from "./header/navigation.js";
import { setupStore } from "./pages/store/store.js";
import api from "./helpers/api.js";
import { LoginManager } from "./managers/loginManager.js";
import { setupChatWidget, removeChatWidget } from "./pages/community/chatWidget.js";
export const HOSTNAME = window.location.hostname;
export async function updateChatWidgetVisibility() {
    if (await LoginManager.isLoggedIn()) {
        setupChatWidget();
    }
    else {
        removeChatWidget();
    }
}
export class MainApp {
    static async init() {
        console.log("init");
        document.addEventListener('DOMContentLoaded', async () => {
            await this.setupHeader();
            this.setupCurrentPage();
            updateChatWidgetVisibility(); // Affiche/masque le chat selon connexion
        });
    }
    static async setupHeader() {
        console.log("setupHeader");
        const headerElement = document.getElementById('header');
        if (!headerElement) {
            console.error('Header element not found');
            return;
        }
        if (await LoginManager.isLoggedIn()) {
            const userInfos = await this.getUserInfo();
            console.log('User infos:', userInfos);
            if (!userInfos) {
                console.error('User infos not found');
                return;
            }
            headerElement.innerHTML = header(userInfos.username, userInfos.profile_picture);
            setupHeader();
        }
        else {
            console.error('User not logged in');
            LoginManager.showLoginModal();
        }
    }
    static setupCurrentPage() {
        console.log("setupCurrentPage");
        const mainElement = document.getElementById('main');
        if (!mainElement) {
            console.error('Main element not found');
            return;
        }
        mainElement.innerHTML = storePage;
        setupStore();
    }
}
_a = MainApp;
MainApp.checkAuth = async () => {
    const response = await api.get(`http://${HOSTNAME}:3000/api/auth/check`);
    const text = await response.text();
    const data = JSON.parse(text);
    return data;
};
MainApp.getUserInfo = async () => {
    try {
        const response = await api.get(`http://${HOSTNAME}:3000/api/user/infos`);
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
console.log("MainApp");
MainApp.init();
