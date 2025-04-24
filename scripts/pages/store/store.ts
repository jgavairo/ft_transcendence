import { setupGameList } from "./gameList.js";



export async function setupStore() 
{
    setupGameList();
}

document.addEventListener('DOMContentLoaded', setupStore);
