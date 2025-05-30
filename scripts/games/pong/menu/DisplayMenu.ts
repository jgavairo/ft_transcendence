// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
import { GameManager } from "../../../managers/gameManager.js";
import { joinQueue, joinTriQueue, startSoloPong, joinTournament} from "../SocketEmit.js";
import { connectPong, onMatchFound, onTriMatchFound, stopGame, MatchState } from "../pongGame.js";
import { socket as gameSocket } from "../network.js";
import { launchSoloPongWithTutorial, launchSoloTriWithTutorial} from "../tutorialLauncher.js";
import { renderPong } from "../renderPong.js";
import { showNotification } from "../../../helpers/notifications.js";

const gameWidth = 1200;
const gameHeight = 800;


type PlayerStatus = { id: string; username: string; ready: boolean };

interface MatchFoundData {
    matchId: string;
    side: number;
    opponent: string;
}

interface Particles
{
    shape: Konva.Circle;
    speed: number;
    glowDirection: number;
}

interface Button
{
    group: Konva.Group;
    text: string;
    action: () => void;
}

export class PongMenuManager
{
    private static instance: PongMenuManager;
    private stage!: Konva.Stage;
    private backgroundLayer!: Konva.Layer;
    private titleLayer!: Konva.Layer;
    private menuLayer!: Konva.Layer;
    private particles: Particles[] = []
    private buttons: Button[] = []
    private titleImage!: Konva.Image;
    private animationSkipped: boolean = false;
    private currentTourId!: string;
    private currentTourSize!: number;
    private myUsername = '';

    constructor(title: boolean)
    {
        PongMenuManager.instance = this;
        const canvas = document.getElementById("games-modal");
        if (!canvas)
        {
            console.error("Canvas not found");
            return;
        }
        this.stage = new Konva.Stage
        ({
            container: canvas,
            width: 1200,
            height: 800
        })

        this.backgroundLayer = new Konva.Layer();
        this.titleLayer = new Konva.Layer();
        this.menuLayer = new Konva.Layer();

        this.stage.add(this.backgroundLayer);
        this.stage.add(this.titleLayer);
        this.stage.add(this.menuLayer);

        this.setupSocketListeners();
        

        // Ajout du fond noir
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
            image.onload = () =>
            {
                this.titleImage = new Konva.Image
                ({
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

    private animateTitle()
    {
        const finalY = 70;
        const speed = 2.3;
        let animationFrame: number;

        const skipAnimation = () => {
            if (this.titleImage) {
                this.titleImage.y(finalY);
                this.titleLayer.batchDraw();
                this.animationSkipped = true;
                cancelAnimationFrame(animationFrame);
                this.stage.off('click', skipAnimation);
                this.changeMenu('main');
            }
        };

        const animate = () =>
        {
            if (this.titleImage.y() < finalY)
            {
                this.titleImage.y(this.titleImage.y() + speed);
                this.titleLayer.batchDraw();
                animationFrame = requestAnimationFrame(animate);
            }
            else
            {
                this.stage.off('click', skipAnimation);
                this.changeMenu('main');
            }
        };

        this.stage.on('click', skipAnimation);
        animate();
    }

    createButton(text: string, x: number, y: number, action: () => void)
    {
        const buttonGroup = new Konva.Group();
        buttonGroup.x(x);
        buttonGroup.y(y);

        const button = new Konva.Rect
        ({
            width: 200,
            height: 60,
            fill: "#002eb2",
            cornerRadius: 5,
            opacity: 0.9,
            stroke: '#00e7fe',
            strokeWidth: 2
        });

        const buttonText = new Konva.Text
        ({
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

        buttonGroup.on('mouseover', () => 
        {
            button.fill('#6506a9');
            button.stroke('#fc4cfc');
            this.menuLayer.batchDraw();
        });

        buttonGroup.on('mouseout', () =>
        {
            button.fill('#002eb2');
            button.stroke('#00e7fe');
            this.menuLayer.batchDraw();
        });

        buttonGroup.on('click', action);

        this.buttons.push
        ({
            group: buttonGroup,
            text: text,
            action: action
        });

        this.menuLayer.add(buttonGroup);
    }

    createButton2(text: string, x: number, y: number, action: () => void)
    {
        const buttonGroup = new Konva.Group();
        buttonGroup.x(x);
        buttonGroup.y(y);

        const button = new Konva.Rect
        ({
            width: 200,
            height: 60,
            fill: "#000000",
            cornerRadius: 5,
            opacity: 0.9,
            stroke: '#555555',
            strokeWidth: 2
        });

        const buttonText = new Konva.Text
        ({
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

        buttonGroup.on('mouseover', () => 
        {
            button.fill('#222222');
            button.stroke('#777777');
            this.menuLayer.batchDraw();
        });

        buttonGroup.on('mouseout', () =>
        {
            button.fill('#000000');
            button.stroke('#555555');
            this.menuLayer.batchDraw();
        });

        buttonGroup.on('click', action);

        this.buttons.push
        ({
            group: buttonGroup,
            text: text,
            action: action
        });

        this.menuLayer.add(buttonGroup);
    }

    private getRandomColor(): string {
        const colors = [
            '#00FFFF', '#4B0082', '#9400D3', '#8A2BE2',
            '#4B0082', '#7B68EE', '#9370DB', '#8B008B',
            '#00BFFF', '#1E90FF'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    private createParticle()
    {
        const particle = new Konva.Circle
        ({
            x: Math.random() * this.stage.width(),
            y: 0,
            radius: 2 + Math.random() * 3,
            fill: this.getRandomColor(),
            opacity: 0.8,
            shadowColor: this.getRandomColor(),
            shadowBlur: 10,
            shadowOpacity: 0.8
        });
        
        this.particles.push
        ({
            shape: particle,
            speed: 0.5 + Math.random() * 2.5,
            glowDirection: 1
        });

        this.backgroundLayer.add(particle);
    }

    private animateParticles(): void
    {
        // Parcourt toutes les particules existantes
        this.particles.forEach((particle, index) => {
            // Déplace la particule vers le bas selon sa vitesse
            particle.shape.y(particle.shape.y() + particle.speed);
            
            // Animation de la lueur
            const currentBlur = particle.shape.shadowBlur();
            if (currentBlur >= 15) particle.glowDirection = -1;
            if (currentBlur <= 5) particle.glowDirection = 1;
            particle.shape.shadowBlur(currentBlur + particle.glowDirection * 0.2);
            
            // Si la particule sort de l'écran par le bas
            if (particle.shape.y() > this.stage.height()) {
                // Supprime la particule du canvas
                particle.shape.destroy();
                // Retire la particule du tableau
                this.particles.splice(index, 1);
            }
        });

        // 5% de chance de créer une nouvelle particule à chaque frame
        if (Math.random() < 0.15) {
            this.createParticle();
        }

        // Rafraîchits l'affichage de la couche d'arrière-plan
        this.backgroundLayer.batchDraw();

        // Continue l'animation à la prochaine frame
        requestAnimationFrame(() => this.animateParticles());
    }

    private updateLayout()
    {
        // Mise à jour du fond noir
        const background = this.backgroundLayer.findOne('Rect');
        if (background) {
            background.width(this.stage.width());
            background.height(this.stage.height());
        }

        if (this.titleImage)
        {
            this.titleImage.x((this.stage.width() - this.titleImage.width()) / 2);
        }

        this.buttons.forEach(button =>
        {
            button.group.x((this.stage.width() - 200) / 2);
        });
        this.stage.batchDraw();
    }

    async changeMenu(menuType: 'main' | 'play' | 'solo' | 'multi' | 'multi-2' | 'multi-3' | 'lobby2' | 'lobby3' | 'tournament')
    {
        this.buttons.forEach(button =>
        {
            button.group.destroy();
        });

        this.buttons = [];

        switch (menuType)
        {
            case 'main':
                this.createButton('PLAY', gameWidth / 2 - 100, 450, () => this.changeMenu('play'));
                this.createButton('QUIT', gameWidth / 2 - 100, 520, () => {
                    const modal = document.getElementById('optionnalModal');
                    this.stage.destroy();
                    if (modal) modal.innerHTML = '';
                });
                break;
            case 'play':
                this.createButton('SOLO', gameWidth / 2 - 100, 450, () => this.changeMenu('solo'));
                this.createButton('MULTI', gameWidth / 2 - 100, 520, () => this.changeMenu('multi'));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('main'));
                break;
            case 'solo':
                this.createButton('1 PLAYER', gameWidth / 2 - 100, 450, () => alert('not implemented yet'));
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
                this.createButton('PRIVATE', gameWidth / 2 - 100, 450, () => this.privateLobby(3));
                this.createButton('ONLINE', gameWidth / 2 - 100, 520, () => this.onlineLobby(3));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('multi'));
                break;
            case 'tournament':
                this.createButton('4 PLAYERS', gameWidth / 2 - 100, 450, () => this.onlineTournament(4));
                this.createButton('8 PLAYERS', gameWidth / 2 - 100, 520, () => this.onlineTournament(8));
                this.createButton('BACK', gameWidth / 2 - 100, 590, () => this.changeMenu('multi'));
                break;
        }
    }

    //fonctions pr tournoi

    private setupSocketListeners() {
        // 1) Bracket (liste des inscrits)
        gameSocket.on('tournamentBracket', (view: {
            tournamentId?: string;
            size: number;
            joined: string[];
            status?: PlayerStatus[];
        }) => {
            this.currentTourSize = view.size;

        if (!view.tournamentId) {
            // Phase d’attente : j’affiche juste la liste sans bouton ready
            this.showLobbyList(view.joined);
        } else {
            // Phase de tournoi lancé !
            this.currentTourId = view.tournamentId;
            this.renderSimpleBracket(view.size, view.joined, view.status!);
        }
        });

        // À chaque update “ready”
        gameSocket.on('tournamentReadyUpdate', (view: {
            tournamentId: string;
            size: number;
            joined: string[];
            status: { id: string; username: string; ready: boolean }[];
        }) => {
            this.renderSimpleBracket(view.size, view.joined, view.status);
        });
      
        // 2) Match trouvé
        gameSocket.on('tournamentMatchFound', (data: MatchFoundData) => {
            this.startMatch(data); 
        });
      
        // 3) Tournoi terminé
        gameSocket.on('tournamentMatchOver', (data: {
            tournamentId: string;
            matchId:      string;
            winner:       string;
            loser:        string;
        }) => {
          showNotification(`🏅 ${data.winner} a gagné contre ${data.loser}`);
        });
      }
      
      private showLobbyList(joined: string[]) {
        this.menuLayer.removeChildren();
        this.menuLayer.add(new Konva.Text({
            x: gameWidth/2 - 130, y: 30 + 450,
            text: `Waiting for player…`,
            fontFamily: 'Press Start 2P', fontSize: 20, fill: '#00e7fe'
        }));
        joined.forEach((u, i) => {
            this.menuLayer.add(new Konva.Text({
            x: gameWidth/2 - 100, y: 80 + i*24 + 450,
            text: `• ${u}`,
            fontFamily: 'Press Start 2P', fontSize: 16, fill: '#fff'
            }));
        });
        this.menuLayer.batchDraw();
    }


      private async joinTournamentQueue(size: 4|8, username: string) {
        try {
          const current = await GameManager.getCurrentUser();
          const userId = current?.id;
          gameSocket.emit('joinTournamentQueue', { size, username, userId });
        } catch {
          gameSocket.emit('joinTournamentQueue', { size, username });
        }
      }
      
      private async onlineTournament(size: 4|8) {
        const current = await GameManager.getCurrentUser();
        const username = current?.username || 'Player';
        this.myUsername = username;
      
      
        // 2) join la queue tournoi
        await this.joinTournamentQueue(size, username);

      }

    private renderSimpleBracket(
        size: number,
        joined: string[],
        status?: PlayerStatus[]
    ) {
    this.menuLayer.removeChildren();

    // 1) On se construit un status "sécurisé"
    const currentStatus: PlayerStatus[] = status
        ? status
        : joined.map(u => ({ id: '', username: u, ready: false }));

    // 2) Titre
    this.menuLayer.add(new Konva.Text({
        x: gameWidth/2 - 130,
        y: 30 + 450,
        text: `Tournoi ${size} joueurs`,
        fontFamily: 'Press Start 2P',
        fontSize: 20,
        fill: '#00e7fe'
    }));

    // 3) Liste des joueurs
    currentStatus.forEach((entry, i) => {
        const fillColor = entry.ready ? '#149414' : '#fff';
        this.menuLayer.add(new Konva.Text({
        x: gameWidth/2 - 100,
        y: 80 + i * 24 + 450,
        text: `• ${entry.username}`,
        fontFamily: 'Press Start 2P',
        fontSize: 16,
        fill: fillColor
        }));
    });

    // 4) Compteur
    const readyCount = currentStatus.filter(s => s.ready).length;
    this.menuLayer.add(new Konva.Text({
        x: gameWidth/2 - 100,
        y: 80 + joined.length * 24 + 10 + 450,
        text: `Waiting… (${readyCount}/${size} ready)`,
        fontFamily: 'Press Start 2P',
        fontSize: 14,
        fill: '#888'
    }));

    // 5) Bouton "Ready" si c'est vous et que vous n'êtes pas déjà ready
    const me = this.myUsername;
    const meEntry = currentStatus.find(s => s.username === me);
    if (meEntry && !meEntry.ready) {
        const btnX = gameWidth/2 - 100;
        const btnY = 700;
        this.createButton('Ready', btnX, btnY, () => {
        gameSocket.emit('playerReady', { tournamentId: this.currentTourId });
        });
    }

    // 6) Final draw
    this.menuLayer.batchDraw();
    }

    /** Lance le match : nettoie le menu, appelle onMatchFound, branche renderPong */
    private async startMatch({ matchId, side, opponent }: MatchFoundData) {
        // 1) Nettoyage de l'UI existante
        this.menuLayer.removeChildren();
        this.menuLayer.batchDraw();
        gameSocket.removeAllListeners('gameState');

        // 2) Connexion et réinitialisation des boutons
        connectPong(true);
        this.buttons.forEach(b => b.group.destroy());
        this.buttons = [];
        this.menuLayer.destroyChildren();

        // 3) Récupération du pseudo
        const current = await GameManager.getCurrentUser();
        const you = current?.username || 'You';

        // 4) Affichage des joueurs
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

        // 5) Countdown avant démarrage du match
        let count = 5;
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
            countdownText.text(`Game starting in ${count}`);
            this.menuLayer.batchDraw();
            } else {
            clearInterval(timer);
            // Démarre la simulation
            onMatchFound({ matchId, side, you, opponent });

            // 6) Hook unique sur gameState
            gameSocket.on('gameState', (state?: MatchState) => {
                // A) Garde-fou si le serveur envoie un état invalide
                if (!state || !state.paddles) return;

                // B) Rend le jeu
                renderPong(state, true);

                // C) À la fin, reporte au serveur et désabonne-toi
                if (state.gameOver) {
                gameSocket.removeAllListeners('gameState');
                gameSocket.emit('tournamentReportResult', {
                    tournamentId: this.currentTourId,
                    matchId
                });
                }
            });
            }
        }, 1000);
    }
    //fonctions tournoi fini ici


    private async onlineLobby(nbPlayers: number)
    {
        const currentUser = await GameManager.getCurrentUser();
        const username = currentUser?.username || "Player";
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
            gameSocket.disconnect()
            this.changeMenu('multi');
        });
    }


    public start()
    {
        this.animateParticles();
        setTimeout(() => {
            if (!this.animationSkipped)
            this.changeMenu('main');
        }, 2000);
        console.log("Menu displayed");

    }

    private async offlineLobby(nbPlayers: number)
    {
        try 
        {
            const menu = PongMenuManager.instance;
            const currentUser = await GameManager.getCurrentUser();
            const username = currentUser?.username || "Player";
            // Nettoyage des éléments existants
            menu.buttons.forEach(button => button.group.destroy());
            menu.buttons = [];
            menu.menuLayer.destroyChildren();
            if (nbPlayers === 2)
            {
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
                } else {
                    clearInterval(countdown);
                    this.launchLocalPong(nbPlayers);
                }
                }, 1000);
            }
            else if (nbPlayers === 3)
            {
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
                    } else {
                        clearInterval(countdown);
                        this.launchLocalPong(nbPlayers);
                    }
                }, 1000);
            }
        }
        catch (error)
        {
            console.error('Error getting current user:', error);
            this.launchLocalPong(nbPlayers);
        }
    }

    async launchLocalPong(nbPlayers: number)
    {
        try 
        {
            const modal = document.getElementById("games-modal");
            if (modal) 
            {
                connectPong(false);
                const currentUser = await GameManager.getCurrentUser();
                const username = currentUser?.username || "Player";
                // modal.innerHTML = '<canvas id="gameCanvas" style="width: 1200px; height: 800px;"></canvas>';
                console.log('Current user for solo 2 players:', username);
                switch (nbPlayers)
                {
                    case 2:
                          await launchSoloPongWithTutorial(modal, username);
                          break;
                    case 3:
                        await launchSoloTriWithTutorial(modal, username);
                        break;
                }
            }
        }
        catch (error)
        {
            console.error('Error getting current user:', error);
            startSoloPong("Player1"); // Fallback au nom par défaut en cas d'erreur
        }
    }

    public displayEndMatch(winnerName: string, padColor: string): void
    {
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

        this.menuLayer.add(winnerText);

        // Animation d'entrée du texte
            const finalY = 300;
            const speed = 5;
            const animate = () => 
            {
                if (winnerText.y() < finalY) {
                    winnerText.y(winnerText.y() + speed);
                    this.menuLayer.batchDraw();
                    requestAnimationFrame(animate);
                }
                else 
                {
                    // Une fois l'animation terminée, on affiche le bouton
                    this.createButton('MENU', gameWidth / 2 - 100, gameHeight - 200, () => {
                        this.stage.destroy();
                        stopGame();
                        displayMenu();
                    });
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
                if (currentBlur >= 15) particle.glowDirection = -1;
                if (currentBlur <= 5) particle.glowDirection = 1;
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
    }

    public static matchFound2Players(data: any) : void
    {
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
            } else {
                clearInterval(countdown);
                onMatchFound(data);
            }
        }, 1000);
    }

    public static matchFound3Players(data: any) : void
    {
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
            } else {
                clearInterval(countdown);
                onTriMatchFound(data);
            }
        }, 1000);
    }

    // Crée une room privée non listée, met l'utilisateur en attente dans la room (sans afficher l'ID)
    private async privateLobby(nbPlayers: number) {
        const currentUser = await GameManager.getCurrentUser();
        const username = currentUser?.username || "Player";
        connectPong(true);
        gameSocket.emit('createPrivateRoom', { username, nbPlayers }, (data: { roomId: string }) => {
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
            this.createButton('QUIT', gameWidth / 2 - 100, 600, () => {
                gameSocket.emit('leavePrivateRoom', { roomId: data.roomId });
                waitingText.destroy();
                // Find and destroy the button from the buttons array
                const quitButton = this.buttons.find(button => button.text === 'QUIT');
                if (quitButton) quitButton.group.destroy();
                gameSocket.disconnect();
                this.changeMenu('multi');
            });
            this.menuLayer.batchDraw();
        });
    }
}

export async function displayMenu() : Promise<void>
{
    const menu = new PongMenuManager(true);
    console.log("game started");
    menu.start();
}
