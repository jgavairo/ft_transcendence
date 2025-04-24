import { setupGameList } from "./gameList.js";
import { setupBuyButtons } from "./buybuttons.js";


export async function setupStore() 
{
    setupGameList();
    setupBuyButtons();
}

document.addEventListener('DOMContentLoaded', setupStore);
