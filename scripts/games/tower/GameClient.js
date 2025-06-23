import { io } from 'socket.io-client';
import { GameRenderer } from './GameRenderer.js';
import { InputHandler } from './InputHandler.js';
import { HOSTNAME } from '../../main.js';
import { showErrorNotification } from '../../helpers/notifications.js';
export class GameClient {
    setupConnection(onConnectedCallback) {
        if (this.socket.connected) {
            onConnectedCallback();
        }
        else {
            // Use .once() for a one-time event listener for the initial connection
            this.socket.once('connect', onConnectedCallback);
            this.socket.connect(); // Explicitly try to connect if not already doing so
        }
    }
    constructor(username, menuManager) {
        this.currentState = null;
        this.roomId = null;
        this.username = username;
        this.menu = menuManager;
        this.socket = io(`https://${HOSTNAME}:8443/tower`, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        this.renderer = new GameRenderer("games-modal", this);
        this.input = new InputHandler(this);
    }
    getStage() {
        return this.renderer.getStage();
    }
    quitMatch(socket) {
        if (socket)
            this.socket.emit("quitMatch", this.roomId, this.username);
        this.roomId = null;
        this.cleanup();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        this.menu.changeMenu('main');
    }
    async endMatch(winner) {
        this.cleanup();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        this.menu.changeMenu('endMatch', winner);
        return;
    }
    launchNewGame(multiplayer) {
        this.renderer.initialize().then(() => {
            switch (multiplayer) {
                case true:
                    this.startMultiplayerMode();
                    break;
                case false:
                    this.startSoloMode();
                    break;
            }
        });
    }
    startSoloMode() {
        this.socket.removeAllListeners(); // Clean up listeners from other modes
        this.setupConnection(() => {
            this.socket.emit("register", this.username);
            this.socket.emit("playSolo", this.username);
        });
        this.socket.on("gameState", (state) => {
            this.currentState = state;
            this.renderer.render(state);
        });
    }
    spawnUnit(troopType) {
        if (!this.currentState)
            return false;
        const playerState = this.renderer.getPlayerSide() === 'player' ? this.currentState.player : this.currentState.enemy;
        const unitscount = playerState.units.length;
        if (unitscount >= 8)
            return false;
        switch (troopType) {
            case 'archer':
                if (playerState.gold >= 20) {
                    this.socket.emit("command", { type: "spawn", troopType });
                    return true;
                }
                return false;
            case 'knight':
                if (playerState.gold >= 50) {
                    this.socket.emit("command", { type: "spawn", troopType });
                    return true;
                }
                return false;
            case 'mage':
                if (playerState.gold >= 60) {
                    this.socket.emit("command", { type: "spawn", troopType });
                    return true;
                }
                return false;
            case 'minotaur':
                if (playerState.gold >= 120) {
                    this.socket.emit("command", { type: "spawn", troopType });
                    return true;
                }
                return false;
            case 'samourai':
                if (playerState.gold >= 60) {
                    this.socket.emit("command", { type: "spawn", troopType });
                    return true;
                }
                return false;
            case 'samouraiArcher':
                if (playerState.gold >= 50) {
                    this.socket.emit("command", { type: "spawn", troopType });
                    return true;
                }
                return false;
            default:
                return false;
        }
    }
    startMultiplayerMode() {
        // Nettoyer les écouteurs existants
        this.socket.removeAllListeners();
        // Utiliser le renderer existant
        this.renderer.showWaitingScreen();
        this.setupConnection(() => {
            this.socket.emit("register", this.username);
            this.socket.emit("joinQueue", this.username);
        });
        this.socket.on("error", (data) => {
            this.renderer.stopWaitingScreen();
            showErrorNotification(data.message);
            this.menu.changeMenu('play');
        });
        this.socket.on("matchFound", (data) => {
            this.roomId = data.roomId;
            this.renderer.stopWaitingScreen();
            this.menu.cleanup();
            this.renderer.setPlayerSide(data.side);
            this.socket.on("gameState", (state) => {
                this.currentState = state;
                this.renderer.render(state);
            });
            // Envoyer un signal que nous sommes prêts
            this.socket.emit("ready", data.roomId);
        });
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }
    cancelMatchmaking() {
        this.socket.emit("leaveQueue");
        this.socket.disconnect();
        this.menu.changeMenu('play');
    }
    cleanup() {
        this.socket.disconnect();
        this.input.cleanup();
        this.renderer.cleanup();
        this.currentState = null;
        this.menu.removeClient();
    }
    startSoloGame() {
        this.socket.emit("playSolo", this.username);
        this.menu.cleanup();
    }
    static async getTowerGameId() {
        if (this.towerGameId !== null)
            return this.towerGameId;
        try {
            const res = await fetch('/api/games/getAll', { credentials: 'include' });
            const data = await res.json();
            if (data.success && Array.isArray(data.games)) {
                const tower = data.games.find((g) => g.name.toLowerCase() === 'tower');
                if (tower) {
                    this.towerGameId = tower.id;
                    return tower.id;
                }
            }
        }
        catch (e) {
            console.error('Erreur lors de la récupération de l\'id du jeu Tower:', e);
        }
        return 3; // fallback
    }
}
GameClient.towerGameId = null;
