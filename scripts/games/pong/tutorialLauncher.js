import { drawTutorialSolo1, drawTutorialSolo2, drawTutorialSolo3 } from './showTutorial.js';
import { startSoloPong, startSoloPongVsBot, startSoloTri } from './SocketEmit.js';
import api from '../../helpers/api.js';
import { HOSTNAME } from '../../main.js';
export async function getFirstPlay() {
    const response = await api.get(`https://${HOSTNAME}:8443/api/games/1/1/hasPhttps://:8443layed`);
    const { hasPlayed } = await response.json();
    return hasPlayed;
}
export async function launchSoloPongVsBot(modal, username) {
    modal.innerHTML = '<canvas id="gameCanvas" width="1200" height="800"></canvas>';
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const response = await api.post(`https://${HOSTNAME}:8443/api/games/isFirstGame`, {
        gameId: 1,
        mode: 1
    });
    const { firstGame } = await response.json();
    if (firstGame) {
        drawTutorialSolo3(canvas, ctx);
        const onEnter = (e) => {
            if (e.key === 'Enter') {
                window.removeEventListener('keydown', onEnter);
                startSoloPongVsBot(username);
            }
        };
        window.addEventListener('keydown', onEnter);
    }
    else {
        startSoloPongVsBot(username);
    }
}
export async function launchSoloPongWithTutorial(modal, username) {
    modal.innerHTML = '<canvas id="gameCanvas" width="1200" height="800"></canvas>';
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const response = await api.post(`https://${HOSTNAME}:8443/api/games/isFirstGame`, {
        gameId: 1,
        mode: 1
    });
    const { firstGame } = await response.json();
    if (firstGame) {
        drawTutorialSolo1(canvas, ctx);
        const onEnter = (e) => {
            if (e.key === 'Enter') {
                window.removeEventListener('keydown', onEnter);
                startSoloPong(username);
            }
        };
        window.addEventListener('keydown', onEnter);
    }
    else {
        startSoloPong(username);
    }
}
export async function launchSoloTriWithTutorial(modal, username) {
    modal.innerHTML = '<canvas id="gameCanvas" width="1200" height="800"></canvas>';
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const response = await api.post(`https://${HOSTNAME}:8443/api/games/isFirstGame`, {
        gameId: 1,
        mode: 3
    });
    const { firstGame } = await response.json();
    if (firstGame) {
        drawTutorialSolo2(canvas, ctx);
        const onEnter = (e) => {
            if (e.key === 'Enter') {
                window.removeEventListener('keydown', onEnter);
                startSoloTri(username);
            }
        };
        window.addEventListener('keydown', onEnter);
    }
    else {
        startSoloTri(username);
    }
}
