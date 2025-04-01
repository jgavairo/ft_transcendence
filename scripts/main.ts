import { storePage, libraryPage, communityPage, header } from "./sourcepage.js";
import { setupHeader } from "./navigation.js";
import { setupStore } from "./store.js";
import api from "./api.js";
import { LoginManager } from "./loginModal.js";

export class MainApp
{
    static async init()
    {
        console.log("init");
        document.addEventListener('DOMContentLoaded', async () => {
            await this.setupHeader();
            this.setupCurrentPage();
        });
    }

    static checkAuth = async () => {
        const response = await api.get('http://127.0.0.1:3000/api/auth/check');
        const text = await response.text();
        const data = JSON.parse(text);
        return data;
    }

    static getUserInfo = async () => {
        try {
            const response = await api.get('http://127.0.0.1:3000/api/header');
            const text = await response.text();
            const data = JSON.parse(text);
            if (data.success) {
                return data;
            }
        } catch (error) {
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
            setupHeader()
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
        mainElement.innerHTML = storePage;
        setupStore();
    }
}
console.log("MainApp");
MainApp.init();