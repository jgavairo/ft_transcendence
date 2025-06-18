import { io, Socket } from 'socket.io-client';
import { GameRenderer } from './GameRenderer.js';
import { InputHandler } from './InputHandler.js';
import { HOSTNAME, MainApp } from '../../main.js';
import { TowerMenuManager } from './GameMenu.js';
import { showErrorNotification, showNotification } from '../../helpers/notifications.js';
import { renderRankings } from '../../pages/library/showGameDetails.js';
import { GameManager } from '../../managers/gameManager.js';


export class GameClient
{
    private socket: Socket;
    private renderer: GameRenderer;
    private input: InputHandler;
    private username: string;
    private currentState: any = null;
    private menu: TowerMenuManager;
    private roomId: string | null = null;
    private static towerGameId: number | null = null;
    constructor(username: string, menuManager: TowerMenuManager)
    {
        this.username = username;
        this.menu = menuManager;
        this.socket = io(`https://${HOSTNAME}:8443/tower`, 
        {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        this.renderer = new GameRenderer("games-modal", this);
        this.input = new InputHandler(this);
    }

    public getStage() {
        return this.renderer.getStage();
    }

    public quitMatch(socket: boolean)
    {
        console.log("Quitting match with roomId:", this.roomId);
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

    public async endMatch(winner: string)
    {
        this.cleanup();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        this.menu.changeMenu('endMatch', winner);
        return;
    }

    public launchNewGame(multiplayer: boolean)
    {
        switch (multiplayer)
        {
            case true:
                this.startMultiplayerMode();
                break;
            case false:
                this.startSoloMode();
                break;
        }
    }

    public startSoloMode()
    {
        console.log("Starting game client");
        this.socket.on("connect", () => 
        {
            console.log("Connected to server Tower");
            console.log("Connected to server Tower, sending username:", this.username);
            this.socket.emit("register", this.username);
            this.socket.emit("playSolo", this.username);
        });
        
        this.socket.on("gameState", (state) =>
        {
            this.currentState = state;
            this.renderer.render(state);
        });
    }


    public spawnUnit(troopType: string): boolean
    {
        if (!this.currentState) return false;
        
        const playerState = this.renderer.getPlayerSide() === 'player' ? this.currentState.player : this.currentState.enemy;
        const unitscount = playerState.units.length;
        if (unitscount >= 8)
            return false;
        switch (troopType)
        {
            case 'archer':
                if (playerState.gold >= 20)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
                return false;
            case 'knight':
                if (playerState.gold >= 50)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
                return false;
            case 'mage':
                if (playerState.gold >= 60)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
                return false;
            case 'minotaur':
                if (playerState.gold >= 120)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
                return false;
            case 'samourai':
                if (playerState.gold >= 60)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
                return false;
            case 'samouraiArcher':
                if (playerState.gold >= 50)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
                return false;
            default:
                return false;
        }
    }

    public startMultiplayerMode() 
    {
        console.log("Joining queue with username:", this.username);
        
        // Nettoyer les écouteurs existants
        this.socket.removeAllListeners();
        
        // Utiliser le renderer existant
        this.renderer.showWaitingScreen();

        this.socket.on("connect", () => 
        {
            console.log("Connected to server Tower, sending username:", this.username);
            this.socket.emit("register", this.username);
            this.socket.emit("joinQueue", this.username);
        });

        this.socket.on("error", (data) => {
            console.log("Error received:", data);
            this.renderer.stopWaitingScreen();
            showErrorNotification(data.message);
            this.menu.changeMenu('play');
        });

        this.socket.on("matchFound", (data) => {
            this.roomId = data.roomId;
            console.log("Match found:", data);
            this.renderer.stopWaitingScreen();
            this.menu.cleanup();
            this.renderer.setPlayerSide(data.side);
            
            this.socket.on("gameState", (state) =>
            {
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

    public cancelMatchmaking() {
        console.log("Canceling matchmaking");
        this.socket.emit("leaveQueue");
        this.socket.disconnect();
        this.menu.changeMenu('play');
    }

    public cleanup()
    {
        this.socket.disconnect();
        this.input.cleanup();
        this.renderer.cleanup();
        this.currentState = null;
        this.menu.removeClient();
    }

    public startSoloGame() 
    {
        console.log("Starting solo game with username:", this.username);
        this.socket.emit("playSolo", this.username);
        this.menu.cleanup();
    }

    private static async getTowerGameId(): Promise<number> {
        if (this.towerGameId !== null) return this.towerGameId;
        try {
            const res = await fetch('/api/games/getAll', { credentials: 'include' });
            const data = await res.json();
            if (data.success && Array.isArray(data.games)) {
                const tower = data.games.find((g: any) => g.name.toLowerCase() === 'tower');
                if (tower) {
                    this.towerGameId = tower.id;
                    return tower.id;
                }
            }
        } catch (e) {
            console.error('Erreur lors de la récupération de l\'id du jeu Tower:', e);
        }
        return 3; // fallback
    }

    public async sendMatchToHistory(winner: string) {
        if (!this.currentState) return;
        // Récupérer les infos nécessaires
        const playerId = this.currentState.player?.id || null;
        const enemyId = this.currentState.enemy?.id || null;
        const playerScore = Math.max(0, Math.min(100, Math.round(this.currentState.player?.tower ?? 0)));
        const enemyScore = Math.max(0, Math.min(100, Math.round(this.currentState.enemy?.tower ?? 0)));
        // Si les IDs ne sont pas présents dans le state, on ne peut pas envoyer l'historique
        if (!playerId || !enemyId) return;
        try {
            const gameId = await GameClient.getTowerGameId();
            await fetch('/api/match/addToHistory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    user1Id: playerId,
                    user2Id: enemyId,
                    gameId: gameId,
                    user1Lives: playerScore,
                    user2Lives: enemyScore,
                }),
            });
        } catch (e) {
            console.error('Erreur lors de l\'envoi de l\'historique Tower:', e);
        }
    }
}