import { io, Socket } from 'socket.io-client';
import { GameRenderer } from './GameRenderer.js';
import { InputHandler } from './InputHandler.js';
import { HOSTNAME, MainApp } from '../../main.js';
import { TowerMenuManager } from './GameMenu.js';

export class GameClient
{
    private socket: Socket;
    private renderer: GameRenderer;
    private input: InputHandler;
    private username: string;
    private currentState: any = null;
    private menu: TowerMenuManager;
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

    public quitMatch()
    {
        this.cleanup();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        this.menu.start();
        this.menu.changeMenu('main');
    }

    public endMatch(winner: string)
    {
        this.cleanup();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        this.menu.start();
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
        let unitConfig = false;
        switch (troopType)
        {
            case 'archer':
                if (playerState.gold >= 40)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
            case 'knight':
                if (playerState.gold >= 50)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
            case 'mage':
                if (playerState.gold >= 60)
                {
                    this.socket.emit("command", {type: "spawn", troopType});
                    return true;
                }
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

        this.socket.on("matchFound", (data) => {
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
        this.menu.start();
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
}