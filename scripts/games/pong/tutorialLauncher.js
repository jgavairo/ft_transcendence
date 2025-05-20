import { drawTutorialSolo1, drawTutorialSolo2 } from './showTutorial.js';
import { startSoloPong, startSoloTri } from './SocketEmit.js';
import api from '../../helpers/api.js';
import { HOSTNAME } from '../../main.js';
export async function getFirstPlay() {
    const response = await api.get(`http://${HOSTNAME}:3000/api/games/1/1/hasPlayed`);
    const { hasPlayed } = await response.json();
    return hasPlayed;
}
export async function launchSoloPongWithTutorial(modal, username) {
    modal.innerHTML = '<canvas id="gameCanvas" width="1200" height="800"></canvas>';
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const response = await api.post(`http://${HOSTNAME}:3000/api/games/isFirstGame`, {
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
    const response = await api.post(`http://${HOSTNAME}:3000/api/games/isFirstGame`, {
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
