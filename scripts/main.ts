import { storePage, libraryPage, communityPage, header } from "./sourcepage.js";
import { setupHeader } from "./navigation.js";
import { setupStore } from "./store.js";
import api from "./api.js";

class MainApp
{
    static init()
    {
        console.log("init");
        document.addEventListener('DOMContentLoaded', () => {
            this.setupHeader();
            this.setupCurrentPage();
        });
    }

    static getUserInfo = async () => {
        try {
            const response = await api.get('http://127.0.0.1:3000/api/header');
            console.log('Response status:', response.status);
            const text = await response.text();
            console.log('Response text:', text);
            const data = JSON.parse(text);
            console.log('Data après parsing:', data);
            if (data.success) {
                console.log('Profile picture:', data.profile_picture);
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

    static setupCurrentPage()
    {
        console.log("setupCurrentPage");
        const mainElement = document.getElementById('main');
        if (!mainElement)
        {
            console.error('Main element not found');
            return;
        }
        console.log("setupCurrentPage");
        mainElement.innerHTML = storePage;
        setupStore();
        
    }
}
console.log("MainApp");
MainApp.init();