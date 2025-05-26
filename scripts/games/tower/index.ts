import { gameModalHTML } from '../../sourcepage.js';
import { GameClient } from './GameClient.js';
import { TowerMenuManager } from './GameMenu.js';
import { MainApp } from '../../main.js';

export async function startTowerGame()
{
    const userInfo = await MainApp.getUserInfo();
    const username = userInfo.username;
    const modal = document.getElementById('optionnalModal');
    if (!modal) 
        return;
    modal.innerHTML = gameModalHTML;
    const menu = new TowerMenuManager(username, (multiplayer: boolean) => {
        const client = new GameClient(username, menu);
        client.launchNewGame(multiplayer);
    });
    menu.start();
}