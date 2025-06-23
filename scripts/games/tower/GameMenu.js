// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
import { MainApp } from "../../main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
import { renderRankings } from "../../pages/library/showGameDetails.js";
import { GameManager } from "../../managers/gameManager.js";
import api from "../../helpers/api.js";
const gameWidth = 1200;
const gameHeight = 800;
export class TowerMenuManager {
    constructor(username, startGameCallback) {
        this.buttons = [];
        this.animationSkipped = false;
        this.animationFrames = []; // Pour stocker les IDs des animations
        this.client = null; // Stockage du client
        TowerMenuManager.instance = this;
        this.username = username;
        this.startGameCallback = startGameCallback;
    }
    cancelAllAnimations() {
        // Annuler toutes les animations en cours
        this.animationFrames.forEach(id => cancelAnimationFrame(id));
        this.animationFrames = [];
    }
    start() {
        // Annuler les animations existantes avant de commencer
        this.cancelAllAnimations();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        // Détruire l'ancien stage s'il existe
        if (this.stage) {
            this.stage.destroy();
        }
        // Créer un nouveau stage
        this.stage = new Konva.Stage({
            container: container,
            width: gameWidth,
            height: gameHeight
        });
        // Initialiser les layers
        this.backgroundLayer = new Konva.Layer();
        this.titleLayer = new Konva.Layer();
        this.menuLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer);
        this.stage.add(this.titleLayer);
        this.stage.add(this.menuLayer);
        // Nettoyer les anciens boutons
        this.buttons = [];
        // Charger le background
        const bgImage = new window.Image();
        bgImage.src = '/assets/games/Tower/TowerBackground.png';
        bgImage.onload = () => {
            const KonvaBg = new Konva.Image({
                image: bgImage,
                x: 0,
                y: 0,
                width: gameWidth,
                height: gameHeight,
                opacity: 0.0
            });
            this.backgroundLayer.add(KonvaBg);
            this.backgroundLayer.batchDraw();
            let opacity = 0;
            const fadeIn = () => {
                opacity += 0.01;
                KonvaBg.opacity(opacity);
                this.backgroundLayer.batchDraw();
                if (opacity < 1) {
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
        };
        // Charger et animer le titre
        const titleImg = new window.Image();
        titleImg.src = '/assets/games/Tower/TowerTitle.png';
        titleImg.onload = () => {
            const scale = 0.4;
            const konvaTitle = new Konva.Image({
                image: titleImg,
                x: (gameWidth - titleImg.width * scale) / 2,
                y: -280,
                width: titleImg.width * scale,
                height: titleImg.height * scale
            });
            this.titleLayer.add(konvaTitle);
            // Animation d'entrée
            const finalY = 20;
            const speed = 2;
            let animationFrame;
            const skipAnimation = () => {
                konvaTitle.y(finalY);
                this.titleLayer.batchDraw();
                this.animationSkipped = true;
                this.cancelAllAnimations();
                this.stage.off('click', skipAnimation);
                this.changeMenu('main');
            };
            const animate = () => {
                if (konvaTitle.y() < finalY) {
                    konvaTitle.y(konvaTitle.y() + speed);
                    this.titleLayer.batchDraw();
                    const id = requestAnimationFrame(animate);
                    this.animationFrames.push(id);
                }
                else {
                    this.stage.off('click', skipAnimation);
                    this.changeMenu('main');
                }
            };
            this.stage.on('click', skipAnimation);
            animate();
        };
        // Gérer le redimensionnement
        window.addEventListener('resize', () => {
            this.stage.width(gameWidth);
            this.stage.height(gameHeight);
            this.updateLayout();
        });
    }
    animateTitle() {
        const finalY = 120;
        const speed = 3;
        let animationFrame;
        const skipAnimation = () => {
            this.titleText.y(finalY);
            this.titleLayer.batchDraw();
            this.animationSkipped = true;
            cancelAnimationFrame(animationFrame);
            this.stage.off('click', skipAnimation);
            this.changeMenu('main');
        };
        const animate = () => {
            if (this.titleText.y() < finalY) {
                this.titleText.y(this.titleText.y() + speed);
                this.titleLayer.batchDraw();
                animationFrame = requestAnimationFrame(animate);
            }
            else {
                this.stage.off('click', skipAnimation);
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
            width: 250,
            height: 70,
            fill: "#FFB300",
            cornerRadius: 10,
            opacity: 1,
            stroke: '#6B3F16',
            strokeWidth: 4,
            shadowColor: "#FF8C00",
            shadowBlur: 15,
            shadowOpacity: 0.4
        });
        const buttonText = new Konva.Text({
            text: text,
            fontFamily: "Press Start 2P",
            fontSize: 22,
            fontWeight: "bold",
            fill: "#6B3F16",
            align: 'center',
            width: 250,
            height: 70,
            y: 22
        });
        buttonGroup.add(button);
        buttonGroup.add(buttonText);
        buttonGroup.on('mouseover', () => {
            button.fill('#D18B00'); // Jaune/marron plus foncé (effet enfoncé)
            button.stroke('#6B3F16'); // Garde le contour foncé
            button.shadowColor('#000000'); // Ombre très discrète ou nulle
            button.shadowBlur(2);
            buttonText.fill('#6B3F16'); // Garde le texte foncé
            buttonText.y(28); // Décale le texte vers le bas (effet appuyé)
            this.menuLayer.batchDraw();
        });
        buttonGroup.on('mouseout', () => {
            button.fill('#FFB300'); // Jaune doré normal
            button.stroke('#6B3F16');
            button.shadowColor('#FF8C00');
            button.shadowBlur(15);
            buttonText.fill('#6B3F16');
            buttonText.y(22); // Remet le texte à sa position normale
            this.menuLayer.batchDraw();
        });
        buttonGroup.on('click', action);
        this.buttons.push({ group: buttonGroup, text: text, action: action });
        this.menuLayer.add(buttonGroup);
    }
    updateLayout() {
        // Met à jour la taille du fond et le centrage des boutons/titre
        const background = this.backgroundLayer.findOne('Rect');
        if (background) {
            background.width(this.stage.width());
            background.height(this.stage.height());
        }
        if (this.titleText) {
            this.titleText.x((this.stage.width() - this.titleText.width()) / 2);
        }
        this.buttons.forEach(button => {
            button.group.x((this.stage.width() - 250) / 2);
        });
        this.stage.batchDraw();
    }
    async launchSoloGame() {
        const isLogged = await MainApp.checkAuth();
        if (!isLogged.success) {
            showErrorNotification("You are disconnected, please login and try again");
            return;
        }
        // Nettoyer l'ancien client s'il existe
        if (this.client) {
            this.client.cleanup();
            this.client = null;
        }
        this.stage.destroy();
        if (this.startGameCallback)
            this.startGameCallback(false);
    }
    async launchMultiGame() {
        const isLogged = await MainApp.checkAuth();
        if (!isLogged.success) {
            showErrorNotification("You are disconnected, please login and try again");
            return;
        }
        this.stage.destroy();
        if (this.startGameCallback)
            this.startGameCallback(true);
    }
    removeClient() {
        if (this.client)
            this.client = null;
    }
    createUnitsPanel() {
        const panelImage = new window.Image();
        panelImage.src = '/assets/games/Tower/UnitsPanel.png';
        panelImage.onload = () => {
            const panel = new Konva.Image({
                image: panelImage,
                x: 0,
                y: 0,
                width: 1200,
                height: 800
            });
            this.backgroundLayer.add(panel);
            this.backgroundLayer.batchDraw();
        };
    }
    async changeMenu(menuType, winner) {
        // Annuler les animations existantes avant de changer de menu
        this.cancelAllAnimations();
        const container = document.getElementById("games-modal");
        if (!container) {
            console.error("Canvas not found");
            return;
        }
        // Détruire l'ancien stage s'il existe
        if (this.stage) {
            this.stage.destroy();
        }
        // Créer un nouveau stage
        this.stage = new Konva.Stage({
            container: container,
            width: gameWidth,
            height: gameHeight
        });
        // Initialiser les layers
        this.backgroundLayer = new Konva.Layer();
        this.titleLayer = new Konva.Layer();
        this.menuLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer);
        this.stage.add(this.titleLayer);
        this.stage.add(this.menuLayer);
        // Nettoyer les layers
        this.backgroundLayer.destroyChildren();
        this.titleLayer.destroyChildren();
        this.menuLayer.destroyChildren();
        // Charger le background normal
        const bgImage = new window.Image();
        bgImage.src = '/assets/games/Tower/TowerBackground.png';
        bgImage.onload = () => {
            const KonvaBg = new Konva.Image({
                image: bgImage,
                x: 0,
                y: 0,
                width: gameWidth,
                height: gameHeight
            });
            this.backgroundLayer.add(KonvaBg);
            this.backgroundLayer.batchDraw();
        };
        // Charger le titre seulement si ce n'est pas le menu units
        if (menuType !== 'units') {
            const titleImg = new window.Image();
            titleImg.src = '/assets/games/Tower/TowerTitle.png';
            titleImg.onload = () => {
                const scale = 0.4;
                const konvaTitle = new Konva.Image({
                    image: titleImg,
                    x: (gameWidth - titleImg.width * scale) / 2,
                    y: 20,
                    width: titleImg.width * scale,
                    height: titleImg.height * scale
                });
                this.titleLayer.add(konvaTitle);
                this.titleLayer.batchDraw();
            };
        }
        // Nettoie les anciens boutons
        this.buttons.forEach(button => button.group.destroy());
        this.buttons = [];
        switch (menuType) {
            case 'main':
                this.createButton('PLAY', gameWidth / 2 - 125, 350, () => this.changeMenu('play'));
                this.createButton('UNITS', gameWidth / 2 - 125, 440, () => this.changeMenu('units'));
                this.createButton('QUIT', gameWidth / 2 - 125, 530, async () => {
                    var _a;
                    const res = await api.get('/api/games/getAll');
                    const data = await res.json();
                    const gameId = (_a = data.games.find((g) => g.name.toLowerCase() === 'tower')) === null || _a === void 0 ? void 0 : _a.id;
                    const rankingsContainer = document.querySelector('#rankings-container');
                    if (rankingsContainer && rankingsContainer.offsetParent !== null) {
                        const currentUser = await GameManager.getCurrentUser();
                        await renderRankings(gameId, rankingsContainer, currentUser);
                    }
                    const modal = document.getElementById('optionnalModal');
                    this.stage.destroy();
                    if (modal)
                        modal.innerHTML = '';
                });
                break;
            case 'play':
                this.createButton('SOLO', gameWidth / 2 - 125, 350, () => this.changeMenu('solo'));
                this.createButton('MULTI', gameWidth / 2 - 125, 440, () => this.changeMenu('multi'));
                this.createButton('BACK', gameWidth / 2 - 125, 530, () => {
                    this.changeMenu('main');
                });
                break;
            case 'solo':
                this.createButton('START GAME', gameWidth / 2 - 125, 440, () => this.launchSoloGame());
                this.createButton('BACK', gameWidth / 2 - 125, 530, () => {
                    this.changeMenu('play');
                });
                break;
            case 'multi':
                this.createButton('SEARCH GAME', gameWidth / 2 - 125, 440, () => this.launchMultiGame());
                this.createButton('BACK', gameWidth / 2 - 125, 530, () => {
                    this.changeMenu('play');
                });
                break;
            case 'units':
                this.createUnitsPanel();
                this.createButton('BACK', gameWidth / 2 - 125, 700, () => {
                    this.changeMenu('main');
                });
                break;
        }
    }
    cleanup() {
        // Annuler toutes les animations
        this.cancelAllAnimations();
        // Nettoyer les event listeners
        if (this.stage) {
            this.stage.off();
        }
        // Détruire les layers
        if (this.backgroundLayer) {
            this.backgroundLayer.destroyChildren();
            this.backgroundLayer.destroy();
        }
        if (this.titleLayer) {
            this.titleLayer.destroyChildren();
            this.titleLayer.destroy();
        }
        if (this.menuLayer) {
            this.menuLayer.destroyChildren();
            this.menuLayer.destroy();
        }
        // Détruire le stage
        if (this.stage) {
            this.stage.destroyChildren();
            this.stage.destroy();
        }
        // Réinitialiser les variables
        this.buttons = [];
        this.animationSkipped = false;
    }
}
