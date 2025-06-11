// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
import { GameManager } from "../../../managers/gameManager.js";
import { joinQueue, joinTriQueue, startSoloPong } from "../SocketEmit.js";
import { connectPong, onMatchFound, onTriMatchFound, stopGame, initTournamentPong, hideGameCanvasAndShowMenu, setPrivateLobbyTrue } from "../pongGame.js";
import { socket as gameSocket } from "../network.js";
import { launchSoloPongVsBot, launchSoloPongWithTutorial, launchSoloTriWithTutorial } from "../tutorialLauncher.js";
import { renderPong } from "../renderPong.js";
import { showErrorNotification, showNotification } from "../../../helpers/notifications.js";
import { MainApp } from "../../../main.js";
const gameWidth = 1200;
const gameHeight = 800;
export class PongMenuManager {
    constructor(title = true, showMainMenu = true) {
        this.particles = [];
        this.buttons = [];
        this.animationSkipped = false;
        this.myUsername = '';
        // Dans DisplayMenu.ts (ou où vous aviez startMatchTournament)
        this.gameStateHandlers = new Map();
        this.activeTournamentMatchId = null;
        PongMenuManager.instance = this;
        this.showMainMenu = showMainMenu;
        // Correction : utiliser le bon container pour Konva
        let canvas = document.getElementById("games-modal");
        if (!canvas) {
            canvas = document.createElement('div');
            canvas.id = 'games-modal';
            canvas.style.width = '1200px';
            canvas.style.height = '800px';
            document.body.appendChild(canvas);
        }
        canvas.style.display = '';
        console.log('[KONVA] games-modal trouvé ou créé');
        // --- Correction : supprime et recrée le div .konvajs-content à chaque fois ---
        let oldKonvaDiv = canvas.querySelector('.konvajs-content');
        if (oldKonvaDiv) {
            oldKonvaDiv.remove();
            console.log('[KONVA] Ancien .konvajs-content supprimé');
        }
        const konvaDiv = document.createElement('div');
        konvaDiv.className = 'konvajs-content';
        konvaDiv.style.position = 'relative';
        konvaDiv.style.width = '1200px';
        konvaDiv.style.height = '800px';
        canvas.appendChild(konvaDiv);
        console.log('[KONVA] Nouveau .konvajs-content ajouté dans games-modal');
        this.stage = new Konva.Stage({
            container: canvas,
            width: 1200,
            height: 800
        });
        console.log('[KONVA] Konva.Stage créé');
        // --- Correction : assure la présence du div Konva et de la classe ---
        let konvaDiv2 = canvas.querySelector('div');
        if (!konvaDiv2) {
            konvaDiv2 = document.createElement('div');
            konvaDiv2.style.position = 'relative';
            konvaDiv2.style.width = '1200px';
            konvaDiv2.style.height = '800px';
            canvas.appendChild(konvaDiv2);
        }
        if (!konvaDiv2.classList.contains('konvajs-content')) {
            konvaDiv2.classList.add('konvajs-content');
        }
        this.backgroundLayer = new Konva.Layer();
        this.titleLayer = new Konva.Layer();
        this.menuLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer);
        this.stage.add(this.titleLayer);
        this.stage.add(this.menuLayer);
        this.setupSocketListeners();
        // Add the black background
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: gameWidth,
            height: gameHeight,
            fill: 'black'
        });
        this.backgroundLayer.add(background);
        if (title) {
            const image = new Image();
            image.src = '../../../../assets/games/pong/title.png';
            image.onload = () => {
                this.titleImage = new Konva.Image({
                    image: image,
                    x: (this.stage.width() - image.width * 0.35) / 2,
                    y: -200,
                    width: image.width * 0.35,
                    height: image.height * 0.35
                });
                this.titleLayer.add(this.titleImage);
                this.animateTitle();
            };
        }
        window.addEventListener('resize', () => {
            this.stage.width(gameWidth);
            this.stage.height(gameHeight);
            this.updateLayout();
        });
    }
    animateTitle() {
        const finalY = 70;
        const speed = 2.3;
        let animationFrame;
        const skipAnimation = () => {
            if (this.titleImage) {
                this.titleImage.y(finalY);
                this.titleLayer.batchDraw();
                this.animationSkipped = true;
                cancelAnimationFrame(animationFrame);
                this.stage.off('click', skipAnimation);
                if (this.showMainMenu)
                    this.changeMenu('main');
            }
        };
        const animate = () => {
            if (this.titleImage.y() < finalY) {
                this.titleImage.y(this.titleImage.y() + speed);
                this.titleLayer.batchDraw();
                animationFrame = requestAnimationFrame(animate);
            }
            else {
                this.stage.off('click', skipAnimation);
                if (this.showMainMenu)
                    this.changeMenu('main');
            }
        };
        this.stage.on('click', skipAnimation);
        animate();
    }
    createButton(text, x, y, action) {
        const buttonGroup = new Konva.Group();
        buttonGroup.x(x);
        buttonGroup.y(y);
        const button = new Konva.Rect({
            width: 200,
            height: 60,
            fill: "#002eb2",
            cornerRadius: 5,
            opacity: 0.9,
            stroke: '#00e7fe',
            strokeWidth: 2
        });
        const buttonText = new Konva.Text({
            text: text,
            fontFamily: "Press Start 2P",
            fontSize: 16,
            fill: "white",
            align: 'center',
            width: 200,
            height: 60,
            y: 25
        });
        buttonGroup.add(button);
        buttonGroup.add(buttonText);
        buttonGroup.on('mouseover', () => {
            button.fill('#6506a9');
            button.stroke('#fc4cfc');
            this.menuLayer.batchDraw();
        });
        buttonGroup.on('mouseout', () => {
            button.fill('#002eb2');
            button.stroke('#00e7fe');
            this.menuLayer.batchDraw();
        });
        buttonGroup.on('click', action);
        this.buttons.push({
            group: buttonGroup,
            text: text,
            action: action
        });
        this.menuLayer.add(buttonGroup);
    }
    createButton2(text, x, y, action) {
        const buttonGroup = new Konva.Group();
        buttonGroup.x(x);
        buttonGroup.y(y);
        const button = new Konva.Rect({
            width: 200,
            height: 60,
            fill: "#000000",
            cornerRadius: 5,
            opacity: 0.9,
            stroke: '#555555',
            strokeWidth: 2
        });
        const buttonText = new Konva.Text({
            text: text,
            fontFamily: "Press Start 2P",
            fontSize: 16,
            fill: "white",
            align: 'center',
            width: 200,
            height: 60,
            y: 25
        });
        buttonGroup.add(button);
        buttonGroup.add(buttonText);
        buttonGroup.on('mouseover', () => {
            button.fill('#222222');
            button.stroke('#777777');
            this.menuLayer.batchDraw();
        });
        buttonGroup.on('mouseout', () => {
            button.fill('#000000');
            button.stroke('#555555');
            this.menuLayer.batchDraw();
        });
        buttonGroup.on('click', action);
        this.buttons.push({
            group: buttonGroup,
            text: text,
            action: action
        });
        this.menuLayer.add(buttonGroup);
    }
    getRandomColor() {
        const colors = [
            '#00FFFF', '#4B0082', '#9400D3', '#8A2BE2',
            '#4B0082', '#7B68EE', '#9370DB', '#8B008B',
            '#00BFFF', '#1E90FF'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    createParticle() {
        const particle = new Konva.Circle({
            x: Math.random() * this.stage.width(),
            y: 0,
            radius: 2 + Math.random() * 3,
            fill: this.getRandomColor(),
            opacity: 0.8,
            shadowColor: this.getRandomColor(),
            shadowBlur: 10,
            shadowOpacity: 0.8
        });
        this.particles.push({
            shape: particle,
            speed: 0.5 + Math.random() * 2.5,
            glowDirection: 1
        });
        this.backgroundLayer.add(particle);
    }
    animateParticles() {
        // Parcourt toutes les particules existantes
        this.particles.forEach((particle, index) => {
            // Déplace la particule vers le bas selon sa vitesse
            particle.shape.y(particle.shape.y() + particle.speed);
            // Animation de la lueur
            const currentBlur = particle.shape.shadowBlur();
            if (currentBlur >= 15)
                particle.glowDirection = -1;
            if (currentBlur <= 5)
                particle.glowDirection = 1;
            particle.shape.shadowBlur(currentBlur + particle.glowDirection * 0.2);
            // Si la particule sort de l'écran par le bas
            if (particle.shape.y() > this.stage.height()) {
                // Supprime la particule du canvas
                particle.shape.destroy();
                // Retire la particule du tableau
                this.particles.splice(index, 1);
            }
        });
        // 5% chance to create a new particle each frame
        if (Math.random() < 0.15) {
            this.createParticle();
        }
        // Refresh the background layer display
        this.backgroundLayer.batchDraw();
        // Continue the animation on the next frame
        requestAnimationFrame(() => this.animateParticles());
    }
    updateLayout() {
        // Update the black background
        const background = this.backgroundLayer.findOne('Rect');
        if (background) {
            background.width(this.stage.width());
            background.height(this.stage.height());
        }
        if (this.titleImage) {
            this.titleImage.x((this.stage.width() - this.titleImage.width()) / 2);
        }
        this.buttons.forEach(button => {
            button.group.x((this.stage.width() - 200) / 2);
        });
        this.stage.batchDraw();
    }
    async changeMenu(menuType) {
        this.buttons.forEach(button => {
            button.group.destroy();
        });
        this.buttons = [];
        switch (menuType) {
            case 'main':
                this.createButton('PLAY', gameWidth / 2 - 100, 450, () => this.changeMenu('play'));
                this.createButton('QUIT', gameWidth / 2 - 100, 520, () => {
                    const modal = document.getElementById('optionnalModal');
                    this.stage.destroy();
                    if (modal)
                        modal.innerHTML = '';
                });
                break;
            case 'play':
                this.createButton('SOLO', gameWidth / 2 - 100, 450, () => this.changeMenu('solo'));
                this.createButton('MULTI', gameWidth / 2 - 100, 520, () => this.changeMenu('multi'));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('main'));
                break;
            case 'solo':
                this.createButton('1 PLAYER', gameWidth / 2 - 100, 450, () => this.offlineLobby(1));
                this.createButton('2 PLAYERS', gameWidth / 2 - 100, 520, () => this.offlineLobby(2));
                this.createButton('3 PLAYERS', gameWidth / 2 - 100, 590, () => this.offlineLobby(3));
                this.createButton('BACK', gameWidth / 2 - 100, 660, () => this.changeMenu('play'));
                break;
            case 'multi':
                this.createButton('2 PLAYERS', gameWidth / 2 - 100, 450, () => this.changeMenu('multi-2'));
                this.createButton('3 PLAYERS', gameWidth / 2 - 100, 520, () => this.changeMenu('multi-3'));
                this.createButton('TOURNAMENT', gameWidth / 2 - 100, 590, () => this.changeMenu('tournament'));
                this.createButton('BACK', gameWidth / 2 - 100, 660, () => this.changeMenu('play'));
                break;
            case 'multi-2':
                this.createButton('PRIVATE', gameWidth / 2 - 100, 450, () => this.privateLobby(2));
                this.createButton('ONLINE', gameWidth / 2 - 100, 520, () => this.onlineLobby(2));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('multi'));
                break;
            case 'multi-3':
                // Suppression du bouton PRIVATE pour 3 joueurs
                this.createButton('ONLINE', gameWidth / 2 - 100, 520, () => this.onlineLobby(3));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('multi'));
                break;
            case 'tournament':
                this.createButton('4 PLAYERS', gameWidth / 2 - 100, 520, () => this.onlineTournament(4));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('multi'));
                break;
        }
    }
    setupSocketListeners() {
        // 1) Bracket (liste des inscrits)
        gameSocket.on('tournamentBracket', (view) => {
            this.currentTourSize = view.size;
            // Si le joueur n'est plus dans la liste, on sort du lobby
            if (view.joined && view.joined.indexOf(this.myUsername) === -1) {
                this.menuLayer.removeChildren();
                this.changeMenu('multi');
                return;
            }
            if (view.tournamentId && view.status) {
                this.currentTourId = view.tournamentId;
                const fullStatus = view.status.map(s => ({
                    id: s.id,
                    username: s.username,
                    ready: s.ready || false,
                    eliminated: s.eliminated || false,
                    isInGame: typeof s.isInGame === 'boolean' ? s.isInGame : undefined
                }));
                this.lastBracketView = {
                    tournamentId: view.tournamentId,
                    size: view.size,
                    joined: view.joined,
                    status: fullStatus
                };
                this.renderSimpleBracket(view.size, view.joined, fullStatus);
            }
            else {
                this.showLobbyList(view.joined);
            }
        });
        // À chaque update "ready"
        gameSocket.on('tournamentReadyUpdate', (view) => {
            this.currentTourSize = view.size;
            this.currentTourId = view.tournamentId;
            // Convertir en PlayerStatus[]
            const fullStatus = view.status.map(s => ({
                id: s.id,
                username: s.username,
                ready: s.ready,
                eliminated: s.eliminated,
                isInGame: typeof s.isInGame === 'boolean' ? s.isInGame : undefined
            }));
            // Mettre à jour la vue stockée
            this.lastBracketView = {
                tournamentId: view.tournamentId,
                size: view.size,
                joined: view.joined,
                status: fullStatus
            };
            // Re-dessiner le bracket
            this.renderSimpleBracket(view.size, view.joined, fullStatus);
        });
        // 2) Match trouvé
        gameSocket.on('tournamentMatchFound', (data) => {
            this.startMatchTournament(data);
        });
        // 3) Tournoi terminé
        gameSocket.on('tournamentOver', (data) => {
            PongMenuManager.tournamentEnded = true;
            console.log('[DEBUG] tournamentOver event received', data, 'tournamentEnded:', PongMenuManager.tournamentEnded);
            this.activeTournamentMatchId = null;
            this.menuLayer.removeChildren();
            // Do NOT call renderSimpleBracket here! Only show winner message and MENU button.
            let winnerText = '';
            if (this.lastBracketView) {
                const me = this.lastBracketView.status.find(s => s.username === this.myUsername);
                const finalists = this.lastBracketView.status.filter(s => !s.eliminated);
                console.log('[DEBUG] tournamentOver: me', me, 'finalists', finalists);
                if (me && !me.eliminated && finalists.length === 2 && finalists.some(f => f.username === data.winner)) {
                    winnerText = `🏆 ${data.winner} wins the tournament!`;
                }
                else {
                    winnerText = `Tournament over! Winner: ${data.winner}`;
                }
            }
            else {
                winnerText = `Tournament over! Winner: ${data.winner}`;
            }
            console.log('[DEBUG] tournamentOver: winnerText', winnerText);
            this.menuLayer.add(new Konva.Text({
                x: gameWidth / 2 - 200,
                y: 350,
                text: winnerText,
                fontFamily: 'Press Start 2P',
                fontSize: 24,
                fill: '#ffe156',
                width: 400,
                align: 'center'
            }));
            this.createButton('MENU', gameWidth / 2 - 100, gameHeight - 200, () => {
                PongMenuManager.tournamentEnded = false;
                console.log('[DEBUG] MENU button clicked, tournamentEnded:', PongMenuManager.tournamentEnded);
                this.activeTournamentMatchId = null;
                this.stage.destroy();
                displayMenu();
            });
            this.menuLayer.batchDraw();
        });
        gameSocket.on('tournamentFinalSpectate', (data) => {
            this.menuLayer.removeChildren();
            this.buttons.forEach(btn => btn.group.destroy());
            this.buttons = [];
            this.menuLayer.add(new Konva.Text({
                x: gameWidth / 2 - 200,
                y: 350,
                text: 'La finale va commencer !',
                fontFamily: 'Press Start 2P',
                fontSize: 20,
                fill: '#ffe156',
                width: 400,
                align: 'center'
            }));
            this.createButton('SPECTATE', gameWidth / 2 - 100, 450, () => {
                // Launch spectator mode for the final
                initTournamentPong(undefined, data.finalists[0], data.finalists[1]);
                // Subscribe to gameState updates for the final
                const handler = (state) => {
                    if (!state || !state.paddles)
                        return;
                    // Render as spectator
                    import('../renderPong.js').then(mod => mod.renderPong(state, true));
                };
                gameSocket.on('gameState', handler);
                // Hide buttons after click
                this.buttons.forEach(btn => btn.group.hide());
            });
            this.createButton('QUIT', gameWidth / 2 - 100, 530, () => {
                this.stage.destroy();
                stopGame();
                displayMenu();
            });
            this.menuLayer.batchDraw();
        });
    }
    showLobbyList(joined) {
        // Set a synthetic tournament ID if not set (for queue phase)
        if (!this.currentTourId) {
            // Default to 4-player queue, or detect from joined size if needed
            this.currentTourId = `queue-${joined.length >= 8 ? 8 : 4}`;
        }
        this.menuLayer.removeChildren();
        this.menuLayer.add(new Konva.Text({
            x: gameWidth / 2 - 130, y: 30 + 450,
            text: `Waiting for player…`,
            fontFamily: 'Press Start 2P', fontSize: 20, fill: '#00e7fe'
        }));
        this.createButton('CANCEL', gameWidth / 2 - 100, 200 + 450, () => {
            console.log('[PONG] CANCEL button clicked, emitting quitTournament', this.currentTourId);
            if (typeof showErrorNotification === 'function')
                showErrorNotification('Cancel clicked, quitTournament envoyé');
            if (this.currentTourId) {
                gameSocket.emit('quitTournament', { tournamentId: this.currentTourId });
                // On cache le bouton pour éviter les doubles clics
                const btn = this.buttons.find(b => b.text === 'CANCEL');
                if (btn)
                    btn.group.hide();
            }
            // Nettoyage complet de l'UI
            this.buttons.forEach(button => button.group.destroy());
            this.buttons = [];
            this.menuLayer.removeChildren();
            // Retour menu multi
            this.changeMenu('multi');
        });
        // Ajout : quitter le tournoi si la page est quittée (refresh/fermeture)
        if (this.currentTourId) {
            const quitHandler = () => {
                gameSocket.emit('quitTournament', { tournamentId: this.currentTourId });
            };
            window.addEventListener('beforeunload', quitHandler, { once: true });
        }
        joined.forEach((u, i) => {
            this.menuLayer.add(new Konva.Text({
                x: gameWidth / 2 - 100, y: 80 + i * 24 + 450,
                text: `• ${u}`,
                fontFamily: 'Press Start 2P', fontSize: 16, fill: '#fff'
            }));
        });
        this.menuLayer.batchDraw();
        // Si le joueur n'est plus dans la liste reçue, on change de menu automatiquement
        if (joined.indexOf(this.myUsername) === -1) {
            this.menuLayer.removeChildren();
            this.changeMenu('multi');
        }
    }
    async joinTournamentQueue(size, username) {
        try {
            const current = await GameManager.getCurrentUser();
            const userId = current === null || current === void 0 ? void 0 : current.id;
            gameSocket.emit('joinTournamentQueue', { size, username, userId });
        }
        catch (_a) {
            gameSocket.emit('joinTournamentQueue', { size, username });
        }
    }
    async onlineTournament(size) {
        const isLogged = await MainApp.checkAuth();
        if (!isLogged.success) {
            showErrorNotification("You are disconnected, please login and try again");
            return;
        }
        const current = await GameManager.getCurrentUser();
        const username = (current === null || current === void 0 ? void 0 : current.username) || 'Player';
        this.myUsername = username;
        // 2) join la queue tournoi
        await this.joinTournamentQueue(size, username);
    }
    initStageAndLayers() {
        const canvas = document.getElementById("games-modal");
        if (!canvas) {
            console.error("Canvas not found");
            return;
        }
        this.stage = new Konva.Stage({
            container: canvas,
            width: 1200,
            height: 800
        });
        // --- Correction : assure la présence du div Konva et de la classe ---
        let konvaDiv = canvas.querySelector('div');
        if (!konvaDiv) {
            konvaDiv = document.createElement('div');
            konvaDiv.style.position = 'relative';
            konvaDiv.style.width = '1200px';
            konvaDiv.style.height = '800px';
            canvas.appendChild(konvaDiv);
        }
        if (!konvaDiv.classList.contains('konvajs-content')) {
            konvaDiv.classList.add('konvajs-content');
        }
        this.backgroundLayer = new Konva.Layer();
        this.titleLayer = new Konva.Layer();
        this.menuLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer);
        this.stage.add(this.titleLayer);
        this.stage.add(this.menuLayer);
        // Add the black background
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: 1200,
            height: 800,
            fill: 'black'
        });
        this.backgroundLayer.add(background);
        this.setupSocketListeners();
        // --- Correction: assure la classe Konva sur le container ---
        // Konva crée un div dans le container, il faut lui remettre la classe si besoin
        const konvaDiv2 = canvas.querySelector('div');
        if (konvaDiv2 && !konvaDiv2.classList.contains('konvajs-content')) {
            konvaDiv2.classList.add('konvajs-content');
        }
    }
    renderSimpleBracket(size, joined, status) {
        if (PongMenuManager.tournamentEnded)
            return;
        const players = joined;
        const statusMap = Object.fromEntries(status.map(s => [s.username, s]));
        const me = statusMap[this.myUsername];
        if (me && me.isInGame) {
            console.log('[DEBUG] Player is in a match, showing overlay');
            this.menuLayer.hide();
            return;
        }
        const canvas = document.getElementById('games-modal');
        const konvaDiv = canvas && canvas.querySelector('.konvajs-content');
        if (!canvas || !konvaDiv) {
            this.initStageAndLayers();
        }
        this.menuLayer.removeChildren();
        this.buttons.forEach(btn => btn.group.destroy());
        this.buttons = [];
        if (size === 4 && players.length === 4) {
            const x0 = gameWidth / 2 - 220;
            const y0 = 540;
            const lineHeight = 38;
            const demi1 = [players[0], players[1]];
            const demi2 = [players[2], players[3]];
            const isInDemi1 = demi1.includes(this.myUsername);
            const isInDemi2 = demi2.includes(this.myUsername);
            const myDemi = isInDemi1 ? demi1 : isInDemi2 ? demi2 : null;
            // --- NO MORE HIDE BRACKET ---
            // Always show bracket and statuses, even if both are ready and match is in progress
            // ...existing code continues with bracket rendering and READY/status logic...
            // Find the player's semi-final
            const myDemiFinale = isInDemi1 ? demi1 : isInDemi2 ? demi2 : null;
            // Check if the player's semi-final is finished
            let myDemiDone = false;
            if (myDemiFinale && myDemiFinale[0] && myDemiFinale[1] && statusMap[myDemiFinale[0]] && statusMap[myDemiFinale[1]]) {
                myDemiDone = statusMap[myDemiFinale[0]].eliminated !== statusMap[myDemiFinale[1]].eliminated;
            }
            // Calculate both semi-finals finished only once
            let demi1Done = false, demi2Done = false;
            if (demi1[0] && demi1[1] && statusMap[demi1[0]] && statusMap[demi1[1]]) {
                demi1Done = statusMap[demi1[0]].eliminated !== statusMap[demi1[1]].eliminated;
            }
            if (demi2[0] && demi2[1] && statusMap[demi2[0]] && statusMap[demi2[1]]) {
                demi2Done = statusMap[demi2[0]].eliminated !== statusMap[demi2[1]].eliminated;
            }
            const bothSemisDone = demi1Done && demi2Done;
            // Always display the bracket
            [demi1, demi2].forEach((pair, j) => {
                pair.forEach((p, i) => {
                    if (p && statusMap[p]) {
                        this.menuLayer.add(new Konva.Text({
                            x: x0,
                            y: y0 + (j * 2 + i) * lineHeight,
                            text: `${i === 0 ? '┌─' : '└─'} ${p}${p === this.myUsername ? ' (You)' : ''}${statusMap[p].eliminated ? ' ❌' : statusMap[p].ready ? ' ✔️' : ''}`,
                            fontFamily: 'Press Start 2P',
                            fontSize: 16,
                            fill: p === this.myUsername ? '#ffe156' : (statusMap[p].eliminated ? '#888' : '#00e7fe')
                        }));
                    }
                });
            });
            const finalists = [demi1, demi2].map(pair => pair.find(p => p && statusMap[p] && !statusMap[p].eliminated));
            const bothFinalistsKnown = finalists[0] && finalists[1];
            // Final round
            if (demi1Done && demi2Done && bothFinalistsKnown) {
                const [finalist1, finalist2] = finalists;
                this.menuLayer.add(new Konva.Text({
                    x: x0 + 260,
                    y: y0 + 1.5 * lineHeight + 10,
                    text: `🏆 Final: ${finalist1} vs ${finalist2}`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 18,
                    fill: '#ffe156'
                }));
                // READY button for eligible finalist
                if (me && !me.eliminated && !me.ready && (this.myUsername === finalist1 || this.myUsername === finalist2)) {
                    this.createButton('READY', gameWidth / 2 - 100, gameHeight - 120, () => {
                        gameSocket.emit('playerReady', { tournamentId: this.currentTourId });
                        this.buttons.forEach(btn => btn.group.hide());
                        this.menuLayer.add(new Konva.Text({
                            x: gameWidth / 2 - 100,
                            y: gameHeight - 120,
                            text: 'Waiting for the other finalist...',
                            fontFamily: 'Press Start 2P',
                            fontSize: 16,
                            fill: '#888',
                            width: 200,
                            align: 'center'
                        }));
                        this.menuLayer.batchDraw();
                    });
                    // SUPPRIME: Quit button at READY step
                    // (rien ici)
                }
                else if (me && (this.myUsername === finalist1 || this.myUsername === finalist2) && me.ready) {
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 100,
                        y: gameHeight - 120,
                        text: 'You are ready! Waiting for the other finalist...',
                        fontFamily: 'Press Start 2P',
                        fontSize: 16,
                        fill: '#ffe156',
                        width: 300,
                        align: 'center'
                    }));
                }
                this.menuLayer.batchDraw();
                return;
            }
            else if (demi1Done || demi2Done) {
                // Only one semi-final done: show waiting message
                this.menuLayer.add(new Konva.Text({
                    x: x0 + 260,
                    y: y0 + 1.5 * lineHeight + 10,
                    text: `Waiting for the other semi-final to finish...`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 16,
                    fill: '#888',
                    width: 300,
                    align: 'center'
                }));
                this.menuLayer.batchDraw();
                // Pas de return ici !
            }
            // READY button pour eligible semi-finalist
            if (me && !me.eliminated && !me.ready) {
                this.createButton('READY', gameWidth / 2 - 100, gameHeight - 120, () => {
                    gameSocket.emit('playerReady', { tournamentId: this.currentTourId });
                    this.buttons.forEach(btn => btn.group.hide());
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 100,
                        y: gameHeight - 80,
                        text: 'Waiting for other player...',
                        fontFamily: 'Press Start 2P',
                        fontSize: 16,
                        fill: '#888',
                        width: 200,
                        align: 'center'
                    }));
                    this.menuLayer.batchDraw();
                });
                // SUPPRIME: Quit button at READY step (semi-final)
                // (rien ici)
            }
            else if (me && !me.eliminated && me.ready) {
                this.menuLayer.add(new Konva.Text({
                    x: gameWidth / 2 - 100,
                    y: gameHeight - 80,
                    text: 'You are ready! Waiting for other player...',
                    fontFamily: 'Press Start 2P',
                    fontSize: 16,
                    fill: '#ffe156',
                    width: 300,
                    align: 'center'
                }));
            }
            this.menuLayer.batchDraw();
            return;
        }
        // Final fallback: show all players and their status (for 2 left, or fallback)
        if (players.length === 2 && size === 4) {
            const [p1, p2] = players;
            if (p1 && p2 && statusMap[p1] && statusMap[p2]) {
                const yFinal = 560;
                const xFinal = gameWidth / 2 - 180;
                const finalist1 = statusMap[p1];
                const finalist2 = statusMap[p2];
                const getStatusIcon = (s) => s.eliminated ? '❌' : s.ready ? '✔️' : '⏳';
                const getStatusText = (s) => s.eliminated ? 'Eliminated' : s.ready ? 'Ready' : 'Waiting';
                this.menuLayer.add(new Konva.Text({
                    x: xFinal,
                    y: yFinal,
                    text: `🏆 FINAL`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 22,
                    fill: '#ffe156',
                    width: 360,
                    align: 'center'
                }));
                this.menuLayer.add(new Konva.Text({
                    x: xFinal,
                    y: yFinal + 40,
                    text: `${getStatusIcon(finalist1)} ${finalist1.username}${finalist1.username === this.myUsername ? ' (You)' : ''}  —  ${getStatusText(finalist1)}`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 18,
                    fill: finalist1.username === this.myUsername ? '#ffe156' : (finalist1.eliminated ? '#888' : '#00e7fe'),
                    width: 360,
                    align: 'center'
                }));
                this.menuLayer.add(new Konva.Text({
                    x: xFinal,
                    y: yFinal + 80,
                    text: `${getStatusIcon(finalist2)} ${finalist2.username}${finalist2.username === this.myUsername ? ' (You)' : ''}  —  ${getStatusText(finalist2)}`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 18,
                    fill: finalist2.username === this.myUsername ? '#ffe156' : (finalist2.eliminated ? '#888' : '#00e7fe'),
                    width: 360,
                    align: 'center'
                }));
                // READY button for eligible finalist
                if (me && !me.eliminated && !me.ready && (this.myUsername === p1 || this.myUsername === p2)) {
                    this.createButton('READY', gameWidth / 2 - 100, gameHeight - 120, () => {
                        gameSocket.emit('playerReady', { tournamentId: this.currentTourId });
                        this.buttons.forEach(btn => btn.group.hide());
                        this.menuLayer.add(new Konva.Text({
                            x: gameWidth / 2 - 100,
                            y: gameHeight - 120,
                            text: 'Waiting for the other finalist...',
                            fontFamily: 'Press Start 2P',
                            fontSize: 16,
                            fill: '#888',
                            width: 200,
                            align: 'center'
                        }));
                        this.menuLayer.batchDraw();
                    });
                    // SUPPRIME: Quit button at READY step (final)
                    // (rien ici)
                }
                else if (me && (this.myUsername === p1 || this.myUsername === p2) && me.ready) {
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 100,
                        y: gameHeight - 120,
                        text: 'You are ready! Waiting for the other finalist...',
                        fontFamily: 'Press Start 2P',
                        fontSize: 16,
                        fill: '#ffe156',
                        width: 300,
                        align: 'center'
                    }));
                }
                this.menuLayer.batchDraw();
                return;
            }
        }
        // Fallback: show all players and their status
        status.forEach((entry, i) => {
            this.menuLayer.add(new Konva.Text({
                x: gameWidth / 2 - 200,
                y: 540 + i * 28,
                text: `${entry.username} ${entry.eliminated ? '(eliminated)' : entry.ready ? '(ready)' : ''}`,
                fontFamily: 'Press Start 2P',
                fontSize: 16,
                fill: entry.eliminated ? '#888' : '#00e7fe'
            }));
        });
        this.menuLayer.batchDraw();
        this.menuLayer.show();
        this.menuLayer.moveToTop();
        if (this.stage && typeof this.stage.draw === 'function') {
            this.stage.draw();
        }
    }
    async startMatchTournament({ matchId, side, opponent }) {
        console.log('[DEBUG] startMatchTournament called', {
            matchId,
            side,
            opponent,
            lastBracketView: this.lastBracketView,
            myUsername: this.myUsername
        });
        // Prevent double launch for the same matchId
        if (this.activeTournamentMatchId === matchId)
            return;
        // Prevent showing bracket/final screen if tournament is already over
        if (PongMenuManager.tournamentEnded)
            return;
        this.activeTournamentMatchId = matchId;
        // Robust check: ensure Konva container is present in DOM
        const canvas = document.getElementById('games-modal');
        const konvaDiv = canvas && canvas.querySelector('.konvajs-content');
        if (!canvas || !konvaDiv) {
            this.initStageAndLayers();
        }
        // 1) Clean up the UI
        this.menuLayer.removeChildren();
        this.menuLayer.batchDraw();
        if (this.lastBracketView) {
            const { size, joined, status } = this.lastBracketView;
            const isFinale = status.length === 2 && size === 4;
            const me = status.find(s => s.username === this.myUsername);
            const iAmInGame = me && !me.eliminated && !me.ready;
            const nonEliminated = status.filter(s => !s.eliminated);
            if (isFinale && nonEliminated.length > 2) {
                if (!iAmInGame) {
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 200,
                        y: 350,
                        text: 'Waiting for other matches to finish...',
                        fontFamily: 'Press Start 2P',
                        fontSize: 20,
                        fill: '#00e7fe',
                        width: 400,
                        align: 'center'
                    }));
                    this.menuLayer.batchDraw();
                }
                return;
            }
            // Both semi-finals are finished, only 2 non-eliminated remain (the finalists)
            // Show bracket and Ready button logic for finalists only
            if (isFinale && nonEliminated.length === 2) {
                const allReady = status.filter(s => !s.eliminated).every(s => s.ready);
                const finalistUsernames = nonEliminated.map(s => s.username);
                let you;
                try {
                    const current = await GameManager.getCurrentUser();
                    you = (current === null || current === void 0 ? void 0 : current.username) || 'You';
                }
                catch (err) {
                    you = 'You';
                }
                const isSpectator = !finalistUsernames.includes(this.myUsername);
                if (allReady) {
                    // Always use usernames for both sides
                    const [finalist1, finalist2] = finalistUsernames;
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 200,
                        y: 350,
                        text: `🏆 Final: ${finalist1} vs ${finalist2}`,
                        fontFamily: 'Press Start 2P',
                        fontSize: 22,
                        fill: '#ffe156',
                        width: 400,
                        align: 'center'
                    }));
                    const countdownText = this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 200,
                        y: 400,
                        text: 'Game starting in 5',
                        fontFamily: 'Press Start 2P',
                        fontSize: 24,
                        fill: '#fc4cfc',
                        width: 400,
                        align: 'center'
                    }));
                    // --- FIX: clear any previous interval and store timer as class property ---
                    if (this.finalCountdownTimer) {
                        clearInterval(this.finalCountdownTimer);
                        this.finalCountdownTimer = undefined;
                    }
                    let count = 5;
                    this.finalCountdownTimer = setInterval(() => {
                        count--;
                        if (count > 0) {
                            countdownText.text(`Game starting in ${count}`);
                            this.menuLayer.batchDraw();
                        }
                        else {
                            clearInterval(this.finalCountdownTimer);
                            this.finalCountdownTimer = undefined;
                            if (isSpectator) {
                                // Spectateur : lance le rendu sans contrôle
                                initTournamentPong(undefined, finalist1, finalist2);
                            }
                            else {
                                // Finaliste : logique normale
                                initTournamentPong(side, you, opponent);
                            }
                            const handler = (state) => {
                                if (!state || !state.paddles)
                                    return;
                                renderPong(state, true);
                                if (state.gameOver) {
                                    gameSocket.off(`gameState`, handler);
                                    this.gameStateHandlers.delete(matchId);
                                    this.activeTournamentMatchId = null;
                                    gameSocket.emit('tournamentReportResult', {
                                        tournamentId: this.currentTourId,
                                        matchId
                                    });
                                    hideGameCanvasAndShowMenu();
                                    if (this.lastBracketView) {
                                        const { size, joined, status } = this.lastBracketView;
                                        this.renderSimpleBracket(size, joined, status);
                                        this.menuLayer.show();
                                        this.menuLayer.moveToTop();
                                        this.menuLayer.batchDraw();
                                    }
                                    setTimeout(() => {
                                        if (this.lastBracketView) {
                                            const { size, joined, status } = this.lastBracketView;
                                            this.renderSimpleBracket(size, joined, status);
                                            this.menuLayer.show();
                                            this.menuLayer.moveToTop();
                                            this.menuLayer.batchDraw();
                                        }
                                        else {
                                            this.menuLayer.removeChildren();
                                            this.menuLayer.add(new Konva.Text({
                                                x: gameWidth / 2 - 130,
                                                y: 350,
                                                text: 'Waiting for the next match... (bracket)',
                                                fontFamily: 'Press Start 2P',
                                                fontSize: 20,
                                                fill: '#00e7fe'
                                            }));
                                            this.menuLayer.show();
                                            this.menuLayer.batchDraw();
                                        }
                                    }, 200);
                                }
                            };
                            this.gameStateHandlers.set(matchId, handler);
                            gameSocket.on(`gameState`, handler);
                        }
                    }, 1000);
                }
                else if (isSpectator) {
                    // DEBUG: Show visible debug text and log values
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 200,
                        y: 320,
                        text: '[DEBUG] ELIMINATED VIEW\nisSpectator: ' + isSpectator + '\nfinalistUsernames: ' + JSON.stringify(finalistUsernames) + '\nmyUsername: ' + this.myUsername,
                        fontFamily: 'Press Start 2P',
                        fontSize: 14,
                        fill: '#ff0000',
                        width: 400,
                        align: 'center'
                    }));
                    console.log('[DEBUG] ELIMINATED VIEW', { isSpectator, finalistUsernames, myUsername: this.myUsername });
                    // Les deux éliminés voient les boutons SPECTATE et QUIT
                    this.menuLayer.add(new Konva.Text({
                        x: gameWidth / 2 - 200,
                        y: 350,
                        text: 'La finale va commencer !',
                        fontFamily: 'Press Start 2P',
                        fontSize: 20,
                        fill: '#ffe156',
                        width: 400,
                        align: 'center'
                    }));
                    this.createButton('SPECTATE', gameWidth / 2 - 100, 450, () => {
                        // Lance le rendu du match final en mode spectateur
                        initTournamentPong(undefined, finalistUsernames[0], finalistUsernames[1]);
                        // Optionnel : masquer les boutons après clic
                        this.buttons.forEach(btn => btn.group.hide());
                    });
                    this.createButton('QUIT', gameWidth / 2 - 100, 530, () => {
                        // Retour menu principal
                        this.stage.destroy();
                        stopGame();
                        displayMenu();
                    });
                    this.menuLayer.batchDraw();
                    return;
                }
                this.menuLayer.batchDraw();
                return;
            }
            // --- END FINAL ROUND LOGIC ---
            // --- SEMI-FINALS OR OTHER ROUNDS ---
            // Normal bracket and Ready logic
            const allReady = status.filter(s => !s.eliminated).every(s => s.ready);
            if (allReady) {
                let you;
                try {
                    const current = await GameManager.getCurrentUser();
                    you = (current === null || current === void 0 ? void 0 : current.username) || 'You';
                }
                catch (err) {
                    you = 'You';
                }
                const p1 = new Konva.Text({
                    x: gameWidth / 6,
                    y: 450,
                    text: you,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    width: 400,
                    align: 'center'
                });
                const p2 = new Konva.Text({
                    x: gameWidth / 2,
                    y: 450,
                    text: opponent,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    width: 400,
                    align: 'center'
                });
                const countdownText = new Konva.Text({
                    x: gameWidth / 2 - 200,
                    y: 520,
                    text: 'Game starting in 5',
                    fontFamily: 'Press Start 2P',
                    fontSize: 24,
                    fill: '#fc4cfc',
                    width: 400,
                    align: 'center'
                });
                this.menuLayer.add(p1, p2, countdownText);
                this.menuLayer.batchDraw();
                let count = 5;
                const timer = setInterval(() => {
                    count--;
                    if (count > 0) {
                        countdownText.text(`Game starting in ${count}`);
                        this.menuLayer.batchDraw();
                    }
                    else {
                        clearInterval(timer);
                        initTournamentPong(side, you, opponent);
                        const handler = (state) => {
                            if (!state || !state.paddles)
                                return;
                            renderPong(state, true);
                            if (state.gameOver) {
                                gameSocket.off(`gameState`, handler);
                                this.gameStateHandlers.delete(matchId);
                                this.activeTournamentMatchId = null;
                                gameSocket.emit('tournamentReportResult', {
                                    tournamentId: this.currentTourId,
                                    matchId
                                });
                                hideGameCanvasAndShowMenu();
                                if (this.lastBracketView) {
                                    const { size, joined, status } = this.lastBracketView;
                                    this.renderSimpleBracket(size, joined, status);
                                    this.menuLayer.show();
                                    this.menuLayer.moveToTop();
                                    this.menuLayer.batchDraw();
                                }
                                setTimeout(() => {
                                    if (this.lastBracketView) {
                                        const { size, joined, status } = this.lastBracketView;
                                        this.renderSimpleBracket(size, joined, status);
                                        this.menuLayer.show();
                                        this.menuLayer.moveToTop();
                                        this.menuLayer.batchDraw();
                                    }
                                    else {
                                        this.menuLayer.removeChildren();
                                        this.menuLayer.add(new Konva.Text({
                                            x: gameWidth / 2 - 130,
                                            y: 350,
                                            text: 'Waiting for the next match... (bracket)',
                                            fontFamily: 'Press Start 2P',
                                            fontSize: 20,
                                            fill: '#00e7fe'
                                        }));
                                        this.menuLayer.show();
                                        this.menuLayer.batchDraw();
                                    }
                                }, 200);
                            }
                        };
                        this.gameStateHandlers.set(matchId, handler);
                        gameSocket.on(`gameState`, handler);
                    }
                }, 1000);
            }
            else {
                this.renderSimpleBracket(size, joined, status);
                this.menuLayer.show();
                this.menuLayer.moveToTop();
                this.menuLayer.batchDraw();
            }
        }
    }
    //fonctions tournoi fini ici
    async onlineLobby(nbPlayers) {
        const isLogged = await MainApp.checkAuth();
        if (!isLogged.success) {
            showErrorNotification("You are disconnected, please login and try again");
            return;
        }
        const currentUser = await GameManager.getCurrentUser();
        const username = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) || "Player";
        connectPong(true);
        if (nbPlayers === 2)
            joinQueue(username);
        else if (nbPlayers === 3)
            joinTriQueue(username);
        else
            throw new Error('Invalid number of players');
        const waitingText = new Konva.Text({
            text: 'waiting for opponent(s)',
            fontFamily: 'Press Start 2P',
            fontSize: 20,
            fill: '#00e7fe',
            x: gameWidth / 2 - 280,
            y: 490,
            width: 600,
        });
        this.menuLayer.add(waitingText);
        // Animation du texte
        let dotCount = 0;
        const animateText = () => {
            dotCount = (dotCount + 1) % 4;
            waitingText.text('waiting for opponent(s)' + '.'.repeat(dotCount));
            this.menuLayer.batchDraw();
            setTimeout(animateText, 500);
        };
        animateText();
        // Nettoyage des boutons existants
        this.buttons.forEach(button => button.group.destroy());
        this.buttons = [];
        this.createButton('CANCEL', gameWidth / 2 - 100, 670, () => {
            // Nettoyage du texte d'attente
            waitingText.destroy();
            gameSocket.disconnect();
            this.changeMenu('multi');
        });
    }
    start() {
        this.animateParticles();
        setTimeout(() => {
            if (!this.animationSkipped && this.showMainMenu)
                this.changeMenu('main');
        }, 2000);
        console.log("Menu displayed");
    }
    async offlineLobby(nbPlayers) {
        try {
            const isLogged = await MainApp.checkAuth();
            if (!isLogged.success) {
                showErrorNotification("You are disconnected, please login and try again");
                return;
            }
            const menu = PongMenuManager.instance;
            const currentUser = await GameManager.getCurrentUser();
            const username = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) || "Player";
            // Nettoyage des éléments existants
            menu.buttons.forEach(button => button.group.destroy());
            menu.buttons = [];
            menu.menuLayer.destroyChildren();
            if (nbPlayers === 1) {
                // Affichage des joueurs
                const player1Text = new Konva.Text({
                    text: `${username}1`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: (gameWidth / 6),
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const player2Text = new Konva.Text({
                    text: `Bot`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: gameWidth / 2,
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const countdownText = new Konva.Text({
                    text: 'Game starting in 5',
                    fontFamily: 'Press Start 2P',
                    fontSize: 24,
                    fill: '#fc4cfc',
                    x: gameWidth / 2 - 200,
                    y: 520,
                    width: 400,
                    align: 'center'
                });
                menu.menuLayer.add(player1Text);
                menu.menuLayer.add(player2Text);
                menu.menuLayer.add(countdownText);
                // Décompte
                let count = 5;
                const countdown = setInterval(() => {
                    count--;
                    if (count > 0) {
                        countdownText.text(`Game starting in ${count}`);
                        menu.menuLayer.batchDraw();
                    }
                    else {
                        clearInterval(countdown);
                        this.launchLocalPong(nbPlayers);
                    }
                }, 1000);
            }
            else if (nbPlayers === 2) {
                // Affichage des joueurs
                const player1Text = new Konva.Text({
                    text: `${username}1`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: (gameWidth / 6),
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const player2Text = new Konva.Text({
                    text: `${username}2`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: gameWidth / 2,
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const countdownText = new Konva.Text({
                    text: 'Game starting in 5',
                    fontFamily: 'Press Start 2P',
                    fontSize: 24,
                    fill: '#fc4cfc',
                    x: gameWidth / 2 - 200,
                    y: 520,
                    width: 400,
                    align: 'center'
                });
                menu.menuLayer.add(player1Text);
                menu.menuLayer.add(player2Text);
                menu.menuLayer.add(countdownText);
                // Décompte
                let count = 5;
                const countdown = setInterval(() => {
                    count--;
                    if (count > 0) {
                        countdownText.text(`Game starting in ${count}`);
                        menu.menuLayer.batchDraw();
                    }
                    else {
                        clearInterval(countdown);
                        this.launchLocalPong(nbPlayers);
                    }
                }, 1000);
            }
            else if (nbPlayers === 3) {
                console.log("match found 2 players");
                const menu = PongMenuManager.instance;
                // Nettoyage des éléments existants
                menu.buttons.forEach(button => button.group.destroy());
                menu.buttons = [];
                menu.menuLayer.destroyChildren();
                // Affichage des joueurs
                const player1Text = new Konva.Text({
                    text: `${username}1`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: 0,
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const player2Text = new Konva.Text({
                    text: `${username}2`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: gameWidth / 3,
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const player3Text = new Konva.Text({
                    text: `${username}3`,
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#00e7fe',
                    x: gameWidth / 3 + ((gameWidth / 3)),
                    y: 450,
                    width: 400,
                    align: 'center'
                });
                const countdownText = new Konva.Text({
                    text: 'Game starting in 5',
                    fontFamily: 'Press Start 2P',
                    fontSize: 24,
                    fill: '#fc4cfc',
                    x: gameWidth / 2 - 200,
                    y: 570,
                    width: 400,
                    align: 'center'
                });
                menu.menuLayer.add(player1Text);
                menu.menuLayer.add(player2Text);
                menu.menuLayer.add(player3Text);
                menu.menuLayer.add(countdownText);
                // Décompte
                let count = 5;
                const countdown = setInterval(() => {
                    count--;
                    if (count > 0) {
                        countdownText.text(`Game starting in ${count}`);
                        menu.menuLayer.batchDraw();
                    }
                    else {
                        clearInterval(countdown);
                        this.launchLocalPong(nbPlayers);
                    }
                }, 1000);
            }
        }
        catch (error) {
            console.error('Error getting current user:', error);
            this.launchLocalPong(nbPlayers);
        }
    }
    async launchLocalPong(nbPlayers) {
        try {
            const modal = document.getElementById("games-modal");
            if (modal) {
                connectPong(false);
                const currentUser = await GameManager.getCurrentUser();
                const username = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) || "Player";
                // modal.innerHTML = '<canvas id="gameCanvas" style="width: 1200px; height: 800px;"></canvas>';
                console.log('Current user for solo 2 players:', username);
                switch (nbPlayers) {
                    case 1:
                        await launchSoloPongVsBot(modal, username);
                        break;
                    case 2:
                        await launchSoloPongWithTutorial(modal, username);
                        break;
                    case 3:
                        await launchSoloTriWithTutorial(modal, username);
                        break;
                }
            }
        }
        catch (error) {
            console.error('Error getting current user:', error);
            startSoloPong("Player1"); // Fallback au nom par défaut en cas d'erreur
        }
    }
    displayEndMatch(winnerName, padColor) {
        // Nettoyage des éléments existants
        this.buttons.forEach(button => button.group.destroy());
        this.buttons = [];
        this.menuLayer.destroyChildren();
        // Création du texte du gagnant
        const winnerText = new Konva.Text({
            text: `${winnerName} WIN`,
            fontFamily: 'Press Start 2P',
            fontSize: 24,
            fill: padColor,
            x: gameWidth / 2 - 200,
            y: -100, // Commence hors écran
            width: 400,
            align: 'center',
            shadowColor: padColor,
            shadowBlur: 20,
            shadowOpacity: 0.8
        });
        // Ajout du texte du timer
        let secondsLeft = 2.5;
        const timerText = new Konva.Text({
            text: `Returning to menu in ${secondsLeft.toFixed(1)}s...`,
            fontFamily: 'Press Start 2P',
            fontSize: 14,
            fill: '#007bff',
            x: gameWidth / 2 - 200,
            y: 550,
            width: 450,
            align: 'center',
        });
        this.menuLayer.add(winnerText);
        this.menuLayer.add(timerText);
        // Animation d'entrée du texte
        const finalY = 300;
        const speed = 5;
        const animate = () => {
            if (winnerText.y() < finalY) {
                winnerText.y(winnerText.y() + speed);
                this.menuLayer.batchDraw();
                requestAnimationFrame(animate);
            }
            else {
                // Timer de redirection
                let interval = setInterval(() => {
                    secondsLeft -= 0.1;
                    if (secondsLeft > 0) {
                        timerText.text(`Returning to menu in ${secondsLeft.toFixed(1)}s...`);
                        this.menuLayer.batchDraw();
                    }
                    else {
                        clearInterval(interval);
                        this.stage.destroy();
                        stopGame();
                        displayMenu();
                    }
                }, 100);
            }
        };
        // Création de particules de victoire
        const createVictoryParticle = () => {
            const particle = new Konva.Circle({
                x: gameWidth / 2 + (Math.random() - 0.5) * 400,
                y: 300 + (Math.random() - 0.5) * 200,
                radius: 2 + Math.random() * 3,
                fill: padColor,
                opacity: 0.8,
                shadowColor: padColor,
                shadowBlur: 10,
                shadowOpacity: 0.8
            });
            this.particles.push({
                shape: particle,
                speed: -1 - Math.random() * 2, // Vitesse négative pour monter
                glowDirection: 1
            });
            this.backgroundLayer.add(particle);
        };
        // Animation des particules de victoire
        const animateVictoryParticles = () => {
            this.particles.forEach((particle, index) => {
                particle.shape.y(particle.shape.y() + particle.speed);
                const currentBlur = particle.shape.shadowBlur();
                if (currentBlur >= 15)
                    particle.glowDirection = -1;
                if (currentBlur <= 5)
                    particle.glowDirection = 1;
                particle.shape.shadowBlur(currentBlur + particle.glowDirection * 0.2);
                if (particle.shape.y() < 0) {
                    particle.shape.destroy();
                    this.particles.splice(index, 1);
                }
            });
            if (Math.random() < 0.2) {
                createVictoryParticle();
            }
            this.backgroundLayer.batchDraw();
            requestAnimationFrame(animateVictoryParticles);
        };
        // Lancement des animations
        animate();
        animateVictoryParticles();
        // À la fin de l'animation, si on était dans une privateLobby, on quitte la room
        if (this.privateRoomId) {
            gameSocket.emit('leavePrivateRoom', { roomId: this.privateRoomId });
            this.privateRoomId = undefined;
        }
    }
    static matchFound2Players(data) {
        console.log("match found 2 players");
        const menu = PongMenuManager.instance;
        // Nettoyage des éléments existants
        menu.buttons.forEach(button => button.group.destroy());
        menu.buttons = [];
        menu.menuLayer.destroyChildren();
        // Affichage des joueurs
        const player1Text = new Konva.Text({
            text: `${data.you}`,
            fontFamily: 'Press Start 2P',
            fontSize: 20,
            fill: '#00e7fe',
            x: (gameWidth / 6),
            y: 450,
            width: 400,
            align: 'center'
        });
        const player2Text = new Konva.Text({
            text: `${data.opponent}`,
            fontFamily: 'Press Start 2P',
            fontSize: 20,
            fill: '#00e7fe',
            x: gameWidth / 2,
            y: 450,
            width: 400,
            align: 'center'
        });
        const countdownText = new Konva.Text({
            x: gameWidth / 2 - 200,
            y: 520,
            text: 'Game starting in 5',
            fontFamily: 'Press Start 2P',
            fontSize: 24,
            fill: '#fc4cfc',
            width: 400,
            align: 'center'
        });
        menu.menuLayer.add(player1Text);
        menu.menuLayer.add(player2Text);
        menu.menuLayer.add(countdownText);
        // Décompte
        let count = 5;
        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.text(`Game starting in ${count}`);
                menu.menuLayer.batchDraw();
            }
            else {
                clearInterval(countdown);
                onMatchFound(data);
            }
        }, 1000);
        // Fermer l'overlay d'invitation si présent
        const inviteOverlay = document.getElementById("inviteOverlay");
        if (inviteOverlay)
            inviteOverlay.remove();
    }
    static matchFound3Players(data) {
        console.log("match found 2 players");
        const menu = PongMenuManager.instance;
        // Nettoyage des éléments existants
        menu.buttons.forEach(button => button.group.destroy());
        menu.buttons = [];
        menu.menuLayer.destroyChildren();
        // Affichage des joueurs
        const player1Text = new Konva.Text({
            text: `${data.players[0]}`,
            fontFamily: 'Press Start 2P',
            fontSize: 20,
            fill: '#00e7fe',
            x: 0,
            y: 450,
            width: 400,
            align: 'center'
        });
        const player2Text = new Konva.Text({
            text: `${data.players[1]}`,
            fontFamily: 'Press Start 2P',
            fontSize: 20,
            fill: '#00e7fe',
            x: gameWidth / 3,
            y: 450,
            width: 400,
            align: 'center'
        });
        const player3Text = new Konva.Text({
            text: `${data.players[2]}`,
            fontFamily: 'Press Start 2P',
            fontSize: 20,
            fill: '#00e7fe',
            x: gameWidth / 3 + ((gameWidth / 3)),
            y: 450,
            width: 400,
            align: 'center'
        });
        const countdownText = new Konva.Text({
            text: 'Game starting in 5',
            fontFamily: 'Press Start 2P',
            fontSize: 24,
            fill: '#fc4cfc',
            x: gameWidth / 2 - 200,
            y: 570,
            width: 400,
            align: 'center'
        });
        menu.menuLayer.add(player1Text);
        menu.menuLayer.add(player2Text);
        menu.menuLayer.add(player3Text);
        menu.menuLayer.add(countdownText);
        // Décompte
        let count = 5;
        const countdown = setInterval(() => {
            count--;
            if (count > 0) {
                countdownText.text(`Game starting in ${count}`);
                menu.menuLayer.batchDraw();
            }
            else {
                clearInterval(countdown);
                onTriMatchFound(data);
            }
        }, 1000);
        // Fermer l'overlay d'invitation si présent
        const inviteOverlay = document.getElementById("inviteOverlay");
        if (inviteOverlay)
            inviteOverlay.remove();
    }
    // Crée une room privée non listée, met l'utilisateur en attente dans la room (sans afficher l'ID)
    // Si roomId est fourni, on rejoint la room existante et on affiche l'écran du salon
    async privateLobby(nbPlayers, roomId) {
        const isLogged = await MainApp.checkAuth();
        if (!isLogged.success) {
            showErrorNotification("You are disconnected, please login and try again");
            return;
        }
        setPrivateLobbyTrue();
        if (nbPlayers !== 2) {
            // Do nothing if not 2 players
            showNotification('This mode is only available for 2 players.');
            return;
        }
        const currentUser = await GameManager.getCurrentUser();
        const username = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) || "Player";
        connectPong(true);
        if (roomId) {
            // Join an existing room (invitation)
            const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
            gameSocket.emit('joinPrivateRoom', { roomId, username, userId }, (data) => {
                this.privateRoomId = data.roomId;
                this.menuLayer.destroyChildren();
                // Add the handler for private match found (display players + countdown)
                const onPrivateMatchFound = (matchData) => {
                    // Clean up existing elements
                    this.buttons.forEach(button => button.group.destroy());
                    this.buttons = [];
                    this.menuLayer.destroyChildren();
                    // Display players (like matchFound2Players)
                    const player1Text = new Konva.Text({
                        text: `${matchData.you}`,
                        fontFamily: 'Press Start 2P',
                        fontSize: 20,
                        fill: '#00e7fe',
                        x: (gameWidth / 6),
                        y: 450,
                        width: 400,
                        align: 'center'
                    });
                    const player2Text = new Konva.Text({
                        text: `${matchData.opponent}`,
                        fontFamily: 'Press Start 2P',
                        fontSize: 20,
                        fill: '#00e7fe',
                        x: gameWidth / 2,
                        y: 450,
                        width: 400,
                        align: 'center'
                    });
                    const countdownText = new Konva.Text({
                        x: gameWidth / 2 - 200,
                        y: 520,
                        text: 'Game starting in 5',
                        fontFamily: 'Press Start 2P',
                        fontSize: 24,
                        fill: '#fc4cfc',
                        width: 400,
                        align: 'center'
                    });
                    this.menuLayer.add(player1Text);
                    this.menuLayer.add(player2Text);
                    this.menuLayer.add(countdownText);
                    // Décompte
                    let count = 5;
                    const countdown = setInterval(() => {
                        count--;
                        if (count > 0) {
                            countdownText.text(`Game starting in ${count}`);
                            this.menuLayer.batchDraw();
                        }
                        else {
                            clearInterval(countdown);
                            onMatchFound(matchData);
                        }
                    }, 1000);
                    // Fermer l'overlay d'invitation si présent
                    const inviteOverlay = document.getElementById("inviteOverlay");
                    if (inviteOverlay)
                        inviteOverlay.remove();
                };
                // On écoute l'event une seule fois pour éviter les doublons
                gameSocket.once('privateMatchFound', onPrivateMatchFound);
            });
        }
        else {
            // Création d'une nouvelle room
            const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
            gameSocket.emit('createPrivateRoom', { username, nbPlayers, userId }, (data) => {
                this.privateRoomId = data.roomId;
                this.menuLayer.destroyChildren();
                const waitingText = new Konva.Text({
                    text: 'Waiting for other players to join...',
                    fontFamily: 'Press Start 2P',
                    fontSize: 20,
                    fill: '#fc4cfc',
                    x: gameWidth / 2 - 250,
                    y: 470,
                    width: 500,
                    align: 'center',
                });
                this.menuLayer.add(waitingText);
                this.createButton('INVITE', gameWidth / 2 - 100, 530, () => {
                    this.showInvitingList(1, data.roomId);
                });
                this.createButton('BACK', gameWidth / 2 - 100, 600, () => {
                    gameSocket.emit('leavePrivateRoom', { roomId: data.roomId });
                    waitingText.destroy();
                    const quitButton = this.buttons.find(button => button.text === 'QUIT');
                    if (quitButton)
                        quitButton.group.destroy();
                    gameSocket.disconnect();
                    this.changeMenu('multi');
                });
                this.menuLayer.batchDraw();
            });
        }
    }
    /**
     * Displays an overlay styled like peopleList, listing all game owners with an INVITE button
     * @param gameId The game ID (e.g. 1 for Pong)
     * @param roomId The private room ID to share
     */
    async showInvitingList(gameId, roomId) {
        // Dynamically import to avoid cycles
        const { fetchUsernames } = await import("../../../pages/community/peopleList.js");
        const { GameManager } = await import("../../../managers/gameManager.js");
        // Get all users
        const people = await fetchUsernames();
        // Get the current user
        let currentUsername = null;
        try {
            const resp = await fetch(`/api/user/infos`, { credentials: "include" });
            const data = await resp.json();
            if (data.success && data.user && data.user.username) {
                currentUsername = data.user.username;
            }
        }
        catch (_a) { }
        // Get the list of games (to get user_ids)
        const allGames = await GameManager.getGameList();
        const game = allGames.find((g) => g.id === gameId);
        let userIds = [];
        try {
            userIds = JSON.parse(game.user_ids || '[]');
        }
        catch (_b) {
            userIds = [];
        }
        // Filter users who own the game and are not the player himself
        const owners = people.filter((p) => userIds.includes(p.id) && p.username !== currentUsername);
        // Remove existing overlay
        let existingOverlay = document.getElementById("inviteOverlay");
        if (existingOverlay)
            existingOverlay.remove();
        // Inject CSS if not already present
        if (!document.getElementById("invite-overlay-css")) {
            const link = document.createElement("link");
            link.id = "invite-overlay-css";
            link.rel = "stylesheet";
            link.href = "/styles/inviteOverlay.css";
            document.head.appendChild(link);
        }
        // Main overlay
        const overlay = document.createElement("div");
        overlay.id = "inviteOverlay";
        overlay.className = "invite-overlay";
        // Close the overlay if clicking outside the container
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                overlay.remove();
            }
        });
        // Container styled like inviteOverlay
        const container = document.createElement("div");
        container.className = "invite-container";
        // Title
        const title = document.createElement("h2");
        title.className = "invite-title";
        title.textContent = "Invite a player";
        container.appendChild(title);
        // List of owners
        owners.forEach((person) => {
            const item = document.createElement("div");
            item.className = "invite-list-item";
            // Info on the left
            const info = document.createElement("div");
            info.className = "invite-info";
            // Photo
            const img = document.createElement("img");
            img.className = "invite-profile-pic";
            img.src = person.profile_picture || "default-profile.png";
            img.alt = person.username;
            // Name
            const name = document.createElement("span");
            name.className = "invite-username";
            name.textContent = person.username;
            info.appendChild(img);
            info.appendChild(name);
            item.appendChild(info);
            // INVITE button on the right
            const inviteBtn = document.createElement("button");
            inviteBtn.className = "invite-btn";
            inviteBtn.textContent = "INVITE";
            inviteBtn.onclick = async () => {
                const now = Date.now();
                const lastInvite = parseInt(localStorage.getItem('lastPongInviteTs') || '0', 10);
                if (now - lastInvite < 10000) {
                    showNotification(`Please wait ${Math.ceil((10000 - (now - lastInvite)) / 1000)}s before sending another invitation.`);
                    return;
                }
                localStorage.setItem('lastPongInviteTs', now.toString());
                // Send a private message in the chat with a clickable link
                const currentUser = await GameManager.getCurrentUser();
                // Use the user id for the author field
                const fromId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
                let link = roomId ? `${window.location.origin}/pong/join?room=${roomId}` : window.origin;
                const message = `@${person.username} Click here to join my Pong game: <a href='${link}' target='_blank'>Join the game</a>`;
                try {
                    const { HOSTNAME } = await import("../../../main.js");
                    const ioClient = (await import("socket.io-client")).io;
                    const socket = ioClient(`https://${HOSTNAME}:8443/chat`, {
                        transports: ['websocket', 'polling'],
                        withCredentials: true,
                        reconnection: true,
                        reconnectionAttempts: 5,
                        reconnectionDelay: 1000
                    });
                    // Send the user id in author
                    socket.emit("sendPrivateMessage", { to: person.id, author: fromId, content: message }, () => { });
                }
                catch (e) {
                    console.error("Error sending private invitation:", e);
                }
                showNotification(`Invitation sent to ${person.username} in the chat!`);
            };
            item.appendChild(inviteBtn);
            container.appendChild(item);
        });
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }
    startFromLink(roomId) {
        this.animateParticles();
        // Start directly the private lobby with the roomId (2 players by default)
        this.privateLobby(2, roomId);
        console.log("Menu displayed from link");
    }
}
PongMenuManager.tournamentEnded = false;
export async function displayMenu() {
    const menu = new PongMenuManager(true);
    console.log("game started");
    menu.start();
}
export async function displayMenuFromLink(roomId) {
    const menu = new PongMenuManager(true, false); // no title, no main menu
    menu.startFromLink(roomId);
}
