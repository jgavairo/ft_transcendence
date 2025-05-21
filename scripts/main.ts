import { storePage, libraryPage, communityPage, header } from "./sourcepage.js";
import { setupHeader } from "./header/navigation.js";
import { setupStore } from "./pages/store/store.js";
import api from "./helpers/api.js";
import { LoginManager } from "./managers/loginManager.js";
import { setupChatWidget, removeChatWidget } from "./pages/community/chatWidget.js";
import { renderPeopleList, setupSearchInput } from "./pages/community/peopleList.js";
import { showCommunityPage } from "./pages/community/community.js";
import { setupLibrary } from "./games/library.js"; // Ajoute cette ligne si tu as une fonction d'init pour la library

export const HOSTNAME = window.location.hostname;

export async function updateChatWidgetVisibility() {
    // Ne recharge pas le widget chat si on est sur la page community
    const currentPage = localStorage.getItem('currentPage') || 'store';
    if (currentPage === 'community') {
        return;
    }
    if (await LoginManager.isLoggedIn()) {
        setupChatWidget();
    } else {
        removeChatWidget();
    }
}

export class MainApp
{
    static async init()
    {
        console.log("init");
        document.addEventListener('DOMContentLoaded', async () => {
            await this.setupHeader();
            this.setupCurrentPage();
            updateChatWidgetVisibility(); // Affiche/masque le chat selon connexion
        });
    }

    static checkAuth = async () => {
        const response = await api.get(`https://${HOSTNAME}:8443/api/auth/check`);
        const text = await response.text();
        const data = JSON.parse(text);
        return data;
    }

    static getUserInfo = async () => {
        try 
        {
            const response = await api.get(`https://${HOSTNAME}:8443/api/user/infos`);
            const text = await response.text();
            const data = JSON.parse(text);
            if (data.success) 
            {
                return data.user;
            }
        } 
        catch (error) 
        {
            console.error('Erreur:', error);
        }
    };

    static async setupHeader()
    {
        console.log("setupHeader");
        const headerElement = document.getElementById('header');
        if (!headerElement)
        {
            console.error('Header element not found');
            return;
        }
        if (await LoginManager.isLoggedIn())
        {
            const userInfos = await this.getUserInfo();
            console.log('User infos:', userInfos);
            if (!userInfos)
            {
                console.error('User infos not found');
                return;
            }
            headerElement.innerHTML = header(userInfos.username, userInfos.profile_picture);
            setupHeader();
        }
        else
        {
            console.error('User not logged in');
            LoginManager.showLoginModal();
        }
    }

    static setupCurrentPage()
    {
        console.log("setupCurrentPage");
        const mainElement = document.getElementById('main');
        if (!mainElement)
        {
            console.error('Main element not found');
            return;
        }
        const currentPage = localStorage.getItem('currentPage') || 'store';

        setTimeout(() => {
            const storeBtn = document.getElementById('storebutton');
            const libraryBtn = document.getElementById('librarybutton');
            const communityBtn = document.getElementById('communitybutton');
            if (storeBtn && libraryBtn && communityBtn) {
                storeBtn.classList.remove('activebutton');
                libraryBtn.classList.remove('activebutton');
                communityBtn.classList.remove('activebutton');
                storeBtn.classList.add('button');
                libraryBtn.classList.add('button');
                communityBtn.classList.add('button');
                if (currentPage === 'store') {
                    storeBtn.classList.add('activebutton');
                    storeBtn.classList.remove('button');
                } else if (currentPage === 'library') {
                    libraryBtn.classList.add('activebutton');
                    libraryBtn.classList.remove('button');
                } else if (currentPage === 'community') {
                    communityBtn.classList.add('activebutton');
                    communityBtn.classList.remove('button');
                }
            }
        }, 0);

        if (currentPage === 'store') {
            mainElement.innerHTML = storePage;
            setupStore();
        } else if (currentPage === 'library') {
            mainElement.innerHTML = libraryPage;
            // Correction : appelle setupLibrary après avoir injecté le HTML
            setTimeout(() => {
                if (typeof setupLibrary === 'function') setupLibrary();
            }, 0);
        } else if (currentPage === 'community') {
            showCommunityPage();
        } else {
            mainElement.innerHTML = storePage;
            setupStore();
        }
    }
}
console.log("MainApp");
MainApp.init();