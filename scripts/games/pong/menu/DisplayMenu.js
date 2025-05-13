// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
import { GameManager } from "../../../managers/gameManager.js";
import { joinQueue, joinTriQueue, startSoloPong, startSoloTri } from "../SocketEmit.js";
import { initPong } from "../TriPong.js";
const gameWidth = 1200;
const gameHeight = 800;
class PongMenuManager {
    constructor() {
        this.particles = [];
        this.buttons = [];
        this.isTitleVisible = false;
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
        this.backgroundLayer = new Konva.Layer();
        this.titleLayer = new Konva.Layer();
        this.menuLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer);
        this.stage.add(this.titleLayer);
        this.stage.add(this.menuLayer);
        // Ajout du fond noir
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: gameWidth,
            height: gameHeight,
            fill: 'black'
        });
        this.backgroundLayer.add(background);
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
        window.addEventListener('resize', () => {
            this.stage.width(gameWidth);
            this.stage.height(gameHeight);
            this.updateLayout();
        });
    }
    animateTitle() {
        const finalY = 70;
        const speed = 2.3;
        const animate = () => {
            if (this.titleImage.y() < finalY) {
                this.titleImage.y(this.titleImage.y() + speed);
                this.titleLayer.batchDraw();
                requestAnimationFrame(animate);
            }
            else {
                this.isTitleVisible = true;
            }
        };
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
            speed: 0.5 + Math.random() * 2,
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
        // 5% de chance de créer une nouvelle particule à chaque frame
        if (Math.random() < 0.05) {
            this.createParticle();
        }
        // Rafraîchits l'affichage de la couche d'arrière-plan
        this.backgroundLayer.batchDraw();
        // Continue l'animation à la prochaine frame
        requestAnimationFrame(() => this.animateParticles());
    }
    updateLayout() {
        // Mise à jour du fond noir
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
    changeMenu(menuType) {
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
                this.createButton('1 PLAYER', gameWidth / 2 - 100, 450, () => alert('not implemented yet'));
                this.createButton('2 PLAYERS', gameWidth / 2 - 100, 520, () => launchLocalPong(2));
                this.createButton('3 PLAYERS', gameWidth / 2 - 100, 590, () => launchLocalPong(3));
                this.createButton('BACK', gameWidth / 2 - 100, 660, () => this.changeMenu('play'));
                break;
            case 'multi':
                this.createButton('2 PLAYERS', gameWidth / 2 - 100, 450, () => launchOnlinePong(2));
                this.createButton('3 PLAYERS', gameWidth / 2 - 100, 520, () => launchOnlinePong(3));
                this.createButton('TOURNAMENT', gameWidth / 2 - 100, 590, () => alert('not implemented yet'));
                this.createButton('BACK', gameWidth / 2 - 100, 660, () => this.changeMenu('play'));
                break;
        }
    }
    start() {
        this.animateParticles();
        this.changeMenu('main');
        console.log("Menu displayed");
    }
}
async function launchLocalPong(nbPlayers) {
    try {
        const modal = document.getElementById("games-modal");
        if (modal) {
            const currentUser = await GameManager.getCurrentUser();
            const username = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) || "Player";
            modal.innerHTML = '<canvas id="gameCanvas" width="1200" height="800"></canvas>';
            console.log('Current user for solo 2 players:', username);
            initPong(username);
            switch (nbPlayers) {
                case 2:
                    startSoloPong(username);
                    break;
                case 3:
                    startSoloTri(username);
                    break;
            }
        }
    }
    catch (error) {
        console.error('Error getting current user:', error);
        startSoloPong("Player1"); // Fallback au nom par défaut en cas d'erreur
    }
}
async function launchOnlinePong(nbPlayers) {
    try {
        const modal = document.getElementById("games-modal");
        if (modal) {
            const currentUser = await GameManager.getCurrentUser();
            const username = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.username) || "Player";
            modal.innerHTML = '<canvas id="gameCanvas" width="1200" height="800"></canvas>';
            console.log('Current user for solo 2 players:', username);
            initPong(username);
            switch (nbPlayers) {
                case 2:
                    joinQueue(username);
                    break;
                case 3:
                    joinTriQueue(username);
                    break;
            }
        }
    }
    catch (error) {
        console.error('Error getting current user:', error);
        displayMenu();
    }
}
export function displayMenu() {
    const menu = new PongMenuManager();
    console.log("game started");
    menu.start();
}
