import { storePage, libraryPage, communityPage, header } from "./sourcepage.js";
import { setupStore } from "./store.js";
import { setupLibrary } from "./library.js";

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

    static setupHeader()
    {
        console.log("setupHeader");
        const headerElement = document.getElementById('header');
        if (!headerElement)
        {
            console.error('Header element not found');
            return;
        }
        headerElement.innerHTML = header;
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