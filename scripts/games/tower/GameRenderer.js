// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
export class GameRenderer {
    constructor(canvasId, gameClient) {
        this.buttons = []; // Pour stocker les boutons
        this.isDestroyed = false;
        this.cooldownAnimationIds = [];
        this.buttonCooldowns = new Map();
        this.cooldownDuration = 2000; // 2 secondes en millisecondes
        this.cooldownSize = 15; // Taille réduite du cercle de cooldown
        this.playerSide = 'player';
        this.matchIsEnded = false;
        this.animationFrame = 0;
        this.lastAnimationFrame = 0;
        this.animationSpeed = 120;
        this.deathAnimationSpeed = 300; // Animation de mort plus lente
        this.frameCount = 8; // Toutes les animations ont maintenant 8 frames
        this.frameWidth = 128;
        this.frameHeight = 128;
        this.images = {};
        // Map pour suivre les frames de mort et leur timing
        this.deathAnimationFrames = new Map();
        this.waitingAnimationFrame = null;
        this.dots = '';
        this.lastDotUpdate = 0;
        this.dotUpdateInterval = 500; // Mise à jour des points toutes les 500ms
        this.gameClient = gameClient;
        this.stage = new Konva.Stage({
            container: canvasId,
            width: 1200,
            height: 800
        });
        this.layer = new Konva.Layer();
        this.buttonsLayer = new Konva.Layer();
        this.stage.add(this.layer);
        this.stage.add(this.buttonsLayer);
        this.loadImages().then(() => {
            this.createUnitButtons();
        });
    }
    loadImages() {
        const paths = {
            background: '/assets/games/Tower/TowerBackground.png',
            playerBase: '/assets/games/Tower/leftTower.png',
            enemyBase: '/assets/games/Tower/rightTower.png',
            coin: '/assets/games/Tower/coin.png',
            endBackground: '/assets/games/Tower/endMatch.png',
            waitingBackground: '/assets/games/Tower/waitingScreen.png',
            // Knight //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            knight_badge: '/assets/games/Tower/characters/knight/badge.png',
            // -------------- Walk
            player_knight_walk: '/assets/games/Tower/characters/knight/knightWalkPlayer.png',
            enemy_knight_walk: '/assets/games/Tower/characters/knight/knightWalkEnemy.png',
            // -------------- Attack
            player_knight_attack: '/assets/games/Tower/characters/knight/knightAttackPlayer.png',
            enemy_knight_attack: '/assets/games/Tower/characters/knight/knightAttackEnemy.png',
            // -------------- Death
            player_knight_dead: '/assets/games/Tower/characters/knight/knightDeadPlayer.png',
            enemy_knight_dead: '/assets/games/Tower/characters/knight/knightDeadEnemy.png',
            // -------------- Idle
            player_knight_idle: '/assets/games/Tower/characters/knight/knightIdlePlayer.png',
            enemy_knight_idle: '/assets/games/Tower/characters/knight/knightIdleEnemy.png',
            // Archer //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            archer_badge: '/assets/games/Tower/characters/archer/badge.png',
            // -------------- Walk
            player_archer_walk: '/assets/games/Tower/characters/archer/archerWalkPlayer.png',
            enemy_archer_walk: '/assets/games/Tower/characters/archer/archerWalkEnemy.png',
            // -------------- Attack
            player_archer_attack: '/assets/games/Tower/characters/archer/archerAttackPlayer.png',
            enemy_archer_attack: '/assets/games/Tower/characters/archer/archerAttackEnemy.png',
            // -------------- Death
            player_archer_dead: '/assets/games/Tower/characters/archer/archerDeadPlayer.png',
            enemy_archer_dead: '/assets/games/Tower/characters/archer/archerDeadEnemy.png',
            // -------------- Idle
            player_archer_idle: '/assets/games/Tower/characters/archer/archerIdlePlayer.png',
            enemy_archer_idle: '/assets/games/Tower/characters/archer/archerIdleEnemy.png'
        };
        const promises = Object.entries(paths).map(([key, src]) => {
            return new Promise((resolve) => {
                const img = new window.Image();
                img.src = src;
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
            });
        });
        return Promise.all(promises).then(() => { });
    }
    handleButtonCooldown(button, image) {
        if (this.isDestroyed) {
            return;
        }
        if (this.buttonCooldowns.get(button)) {
            return;
        }
        this.buttonCooldowns.set(button, true);
        // Créer le groupe pour le cooldown
        const cooldownGroup = new Konva.Group({
            x: image.x() - image.width() / 2 + 10,
            y: image.y() - image.height() / 2 + 10 // Décalage de 10px du bord
        });
        // Arc de progression (cercle plein)
        const cooldownArc = new Konva.Arc({
            innerRadius: 0,
            outerRadius: Math.max(0, this.cooldownSize / 2),
            angle: 0,
            rotation: -90,
            fill: '#32CD32',
            opacity: 1
        });
        cooldownGroup.add(cooldownArc);
        button.add(cooldownGroup);
        // Appliquer l'effet grisé au bouton
        const originalFilter = image.filters();
        image.filters([Konva.Filters.Grayscale]);
        image.opacity(0.5);
        button.listening(false);
        // Animation
        const startTime = Date.now();
        const animate = () => {
            if (this.isDestroyed)
                return;
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.cooldownDuration, 1);
            cooldownArc.angle(360 * progress);
            this.buttonsLayer.batchDraw();
            if (progress < 1) {
                const id = requestAnimationFrame(animate);
                this.cooldownAnimationIds.push(id);
            }
            else {
                // Animation terminée
                cooldownGroup.destroy();
                image.filters(originalFilter);
                image.opacity(1);
                button.listening(true);
                this.buttonCooldowns.set(button, false);
                this.buttonsLayer.batchDraw();
            }
        };
        animate();
    }
    createUnitButtons() {
        const buttonY = 700;
        const buttonSpacing = 80;
        if (this.images.archer_badge && this.images.knight_badge) {
            const buttonHeight = 1024 * 0.09;
            const buttonWidth = 768 * 0.09;
            // Bouton Archer
            const archerButton = new Konva.Group();
            const archerImage = new Konva.Image({
                image: this.images.archer_badge,
                x: 480,
                y: buttonY,
                height: buttonHeight,
                width: buttonWidth,
                offsetX: buttonWidth / 2,
                offsetY: buttonHeight / 2
            });
            archerButton.add(archerImage);
            this.buttonCooldowns.set(archerButton, false);
            archerButton.on('click', () => {
                if (!this.buttonCooldowns.get(archerButton)) {
                    console.log('Spawn archer');
                    const spawnSuccess = this.gameClient.spawnUnit('archer');
                    console.log('Spawn success:', spawnSuccess);
                    if (spawnSuccess) {
                        this.handleButtonCooldown(archerButton, archerImage);
                    }
                }
            });
            archerButton.on('mouseover', () => {
                if (!this.buttonCooldowns.get(archerButton)) {
                    document.body.style.cursor = 'pointer';
                    archerImage.scale({ x: 1.1, y: 1.1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            archerButton.on('mouseout', () => {
                if (!this.buttonCooldowns.get(archerButton)) {
                    document.body.style.cursor = 'default';
                    archerImage.scale({ x: 1, y: 1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            // Ajuster la position pour tenir compte du nouveau point d'origine
            archerImage.x(480 + buttonWidth / 2);
            archerImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(archerButton);
            this.buttons.push(archerButton);
            // Bouton Knight
            const knightButton = new Konva.Group();
            const knightImage = new Konva.Image({
                image: this.images.knight_badge,
                x: 480 + buttonSpacing,
                y: buttonY,
                height: buttonHeight,
                width: buttonWidth,
                offsetX: buttonWidth / 2,
                offsetY: buttonHeight / 2
            });
            knightButton.add(knightImage);
            this.buttonCooldowns.set(knightButton, false);
            knightButton.on('click', () => {
                if (!this.buttonCooldowns.get(knightButton)) {
                    console.log('Spawn knight');
                    const spawnSuccess = this.gameClient.spawnUnit('knight');
                    console.log('Spawn success:', spawnSuccess);
                    if (spawnSuccess) {
                        this.handleButtonCooldown(knightButton, knightImage);
                    }
                }
            });
            knightButton.on('mouseover', () => {
                if (!this.buttonCooldowns.get(knightButton)) {
                    document.body.style.cursor = 'pointer';
                    knightImage.scale({ x: 1.1, y: 1.1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            knightButton.on('mouseout', () => {
                if (!this.buttonCooldowns.get(knightButton)) {
                    document.body.style.cursor = 'default';
                    knightImage.scale({ x: 1, y: 1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            // Ajuster la position pour tenir compte du nouveau point d'origine
            knightImage.x(480 + buttonSpacing + buttonWidth / 2);
            knightImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(knightButton);
            this.buttons.push(knightButton);
        }
        this.buttonsLayer.draw();
    }
    cleanup() {
        if (this.isDestroyed)
            return; // Éviter le double cleanup
        this.isDestroyed = true;
        this.matchIsEnded = true;
        // Remettre le curseur par défaut
        document.body.style.cursor = 'default';
        // Arrêter toutes les animations en cours
        this.cooldownAnimationIds.forEach(id => cancelAnimationFrame(id));
        this.cooldownAnimationIds = [];
        // Retirer tous les event listeners des boutons
        this.buttons.forEach(button => {
            button.off('mouseover mouseout click');
        });
        // Nettoyer les maps et tableaux AVANT de détruire les layers
        this.buttons = [];
        this.buttonCooldowns.clear();
        this.deathAnimationFrames.clear();
        try {
            // Détruire les layers dans l'ordre
            if (this.buttonsLayer) {
                this.buttonsLayer.destroyChildren();
                this.buttonsLayer.destroy();
            }
            if (this.layer) {
                this.layer.destroyChildren();
                this.layer.destroy();
            }
            // Détruire le stage en dernier
            if (this.stage) {
                this.stage.destroyChildren();
                this.stage.destroy();
            }
        }
        catch (error) {
            console.error("Erreur pendant le cleanup:", error);
        }
        // S'assurer que les références sont nulles
        this.buttonsLayer = null;
        this.layer = null;
        this.stage = null;
    }
    render(state) {
        if (this.isDestroyed || !this.layer || !this.stage) {
            return;
        }
        if (this.matchIsEnded) {
            return;
        }
        this.layer.destroyChildren();
        const now = Date.now();
        if (now - this.lastAnimationFrame > this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % this.frameCount;
            this.lastAnimationFrame = now;
        }
        // Nettoyage des unités mortes du Map
        this.deathAnimationFrames.forEach((_, unitId) => {
            const unitExists = [...state.player.units, ...state.enemy.units].some(unit => unit.id === unitId);
            if (!unitExists) {
                this.deathAnimationFrames.delete(unitId);
            }
        });
        if (this.images.background) {
            this.layer.add(new Konva.Image({
                image: this.images.background,
                width: 1200,
                height: 800,
                x: 0,
                y: 0
            }));
        }
        // Affiche la base du joueur
        this.layer.add(new Konva.Image({
            image: this.images.playerBase,
            x: -50,
            y: 330,
            scaleX: 0.5,
            scaleY: 0.5
        }));
        // Affiche la base ennemie
        this.layer.add(new Konva.Image({
            image: this.images.enemyBase,
            x: 1040,
            y: 330,
            scaleX: 0.5,
            scaleY: 0.5
        }));
        // Affiche les unités du joueur
        state.player.units.forEach((unit) => {
            let currentFrame = this.animationFrame;
            // Gestion spéciale pour l'animation de mort
            if (unit.state === 'dead') {
                if (!this.deathAnimationFrames.has(unit.id)) {
                    this.deathAnimationFrames.set(unit.id, { frame: 0, lastUpdate: now });
                }
                const deathAnim = this.deathAnimationFrames.get(unit.id);
                if (now - deathAnim.lastUpdate > this.deathAnimationSpeed) {
                    if (deathAnim.frame < this.frameCount - 1) {
                        deathAnim.frame++;
                        deathAnim.lastUpdate = now;
                    }
                }
                currentFrame = deathAnim.frame;
            }
            this.layer.add(new Konva.Image({
                x: unit.x,
                y: unit.y,
                image: this.images[`player_${unit.state === 'attacking' ? unit.attackImgKey :
                    unit.state === 'idle' ? unit.idleImgKey :
                        unit.state === 'dead' ? unit.deadImgKey :
                            unit.imgKey}`],
                width: this.frameWidth,
                height: this.frameHeight,
                crop: {
                    x: currentFrame * this.frameWidth,
                    y: 0,
                    width: this.frameWidth,
                    height: this.frameHeight
                }
            }));
        });
        // Affiche les unités ennemies
        state.enemy.units.forEach((unit) => {
            let currentFrame = this.animationFrame;
            // Gestion spéciale pour l'animation de mort
            if (unit.state === 'dead') {
                if (!this.deathAnimationFrames.has(unit.id)) {
                    this.deathAnimationFrames.set(unit.id, { frame: 0, lastUpdate: now });
                }
                const deathAnim = this.deathAnimationFrames.get(unit.id);
                if (now - deathAnim.lastUpdate > this.deathAnimationSpeed) {
                    if (deathAnim.frame < this.frameCount - 1) {
                        deathAnim.frame++;
                        deathAnim.lastUpdate = now;
                    }
                }
                currentFrame = deathAnim.frame;
            }
            this.layer.add(new Konva.Image({
                x: unit.x,
                y: unit.y,
                image: this.images[`enemy_${unit.state === 'attacking' ? unit.attackImgKey :
                    unit.state === 'idle' ? unit.idleImgKey :
                        unit.state === 'dead' ? unit.deadImgKey :
                            unit.imgKey}`],
                width: this.frameWidth,
                height: this.frameHeight,
                crop: {
                    x: currentFrame * this.frameWidth,
                    y: 0,
                    width: this.frameWidth,
                    height: this.frameHeight
                }
            }));
        });
        const playerHP = state.player.tower;
        const maxPlayerHP = 500;
        const enemyHP = state.enemy.tower;
        const maxEnemyHP = 500;
        if (playerHP <= 0 || enemyHP <= 0) {
            this.matchIsEnded = true;
            const winner = playerHP <= 0 ? state.enemy.username : state.player.username;
            // Nettoyer l'écran
            this.layer.destroyChildren();
            this.buttonsLayer.destroyChildren();
            // Ajouter le fond
            if (this.images.endBackground) {
                const background = new Konva.Image({
                    image: this.images.endBackground,
                    width: 1200,
                    height: 800,
                    opacity: 0.9
                });
                this.layer.add(background);
            }
            else {
                // Fallback au rectangle noir si l'image n'est pas chargée
                const background = new Konva.Rect({
                    width: 1200,
                    height: 800,
                    fill: 'black',
                    opacity: 0.9
                });
                this.layer.add(background);
            }
            // Ajouter le texte du gagnant
            const winnerText = new Konva.Text({
                text: `${winner} WIN !`,
                fontFamily: 'Press Start 2P',
                fontSize: 48,
                fill: '#FFD700',
                x: 0,
                y: 300,
                width: 1200,
                align: 'center',
                shadowColor: '#000',
                shadowBlur: 10,
                shadowOffset: { x: 5, y: 5 },
                shadowOpacity: 0.5
            });
            this.layer.add(winnerText);
            // Créer un bouton pour retourner au menu
            const buttonGroup = new Konva.Group({
                x: (1200 - 250) / 2,
                y: 450
            });
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
                text: "QUIT",
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
            });
            buttonGroup.on('mouseout', () => {
                button.fill('#FFB300'); // Jaune doré normal
                button.stroke('#6B3F16');
                button.shadowColor('#FF8C00');
                button.shadowBlur(15);
                buttonText.fill('#6B3F16');
                buttonText.y(22); // Remet le texte à sa position normale
            });
            buttonGroup.on('click', () => {
                this.gameClient.quitMatch();
            });
            this.layer.add(buttonGroup);
            this.layer.draw();
            return;
        }
        const barWidth = 250;
        const barHeight = 25;
        const playerHPWidth = Math.max(0, barWidth * (playerHP / maxPlayerHP));
        const enemyHPWidth = Math.max(0, barWidth * (enemyHP / maxEnemyHP));
        this.layer.add(new Konva.Rect({
            x: 10,
            y: 15,
            width: barWidth,
            height: barHeight,
            fill: "#333",
            cornerRadius: 4
        }));
        this.layer.add(new Konva.Rect({
            x: 10,
            y: 15,
            width: playerHPWidth,
            height: barHeight,
            fill: "red",
            cornerRadius: 4
        }));
        this.layer.add(new Konva.Rect({
            x: 940,
            y: 15,
            width: barWidth,
            height: barHeight,
            fill: "#333",
            cornerRadius: 4
        }));
        this.layer.add(new Konva.Rect({
            x: 940,
            y: 15,
            width: enemyHPWidth,
            height: barHeight,
            fill: "red",
            cornerRadius: 4
        }));
        // Affiche l'or et les HP
        this.layer.add(new Konva.Image({
            image: this.images.coin,
            x: 10,
            y: 745,
            width: 48,
            height: 48
        }));
        this.layer.add(new Konva.Text({
            x: 55,
            y: 760,
            width: barWidth,
            fontFamily: "Press Start 2P",
            text: `${Math.floor(this.playerSide === 'player' ? state.player.gold : state.enemy.gold)}`,
            fontSize: 24,
            fontWeight: "bold",
            fill: "yellow"
        }));
        this.layer.add(new Konva.Text({
            x: 10,
            y: 60,
            width: barWidth,
            text: state.player.username,
            fontSize: 24,
            fontWeight: "bold",
            align: "center",
            fontFamily: "Press Start 2P",
            shadowColor: "#000",
            shadowBlur: 4,
            shadowOpacity: 0.5,
            fill: "white"
        }));
        this.layer.add(new Konva.Text({
            x: 940,
            y: 60,
            width: barWidth,
            text: state.enemy.username,
            fontSize: 24,
            fontWeight: "bold",
            align: "center",
            fontFamily: "Press Start 2P",
            shadowColor: "#000",
            shadowBlur: 4,
            shadowOpacity: 0.5,
            fill: "white"
        }));
        this.layer.draw();
    }
    getStage() {
        return this.stage;
    }
    setPlayerSide(side) {
        this.playerSide = side;
    }
    getPlayerSide() {
        return this.playerSide;
    }
    showWaitingScreen() {
        if (this.isDestroyed || !this.layer || !this.stage)
            return;
        this.layer.destroyChildren();
        this.buttonsLayer.hide();
        // Fond noir semi-transparent
        const background = new Konva.Image({
            image: this.images.waitingBackground,
            width: 1200,
            height: 800,
            opacity: 1
        });
        this.layer.add(background);
        // Texte "Recherche d'un adversaire"
        const waitingText = new Konva.Text({
            text: 'Recherche d\'un adversaire',
            fontFamily: 'Press Start 2P',
            fontSize: 36,
            fill: '#FFD700',
            x: 0,
            y: 300,
            width: 1200,
            align: 'center',
            shadowColor: '#000',
            shadowBlur: 10,
            shadowOffset: { x: 5, y: 5 },
            shadowOpacity: 0.5
        });
        this.layer.add(waitingText);
        // Points animés
        const dotsText = new Konva.Text({
            text: '',
            fontFamily: 'Press Start 2P',
            fontSize: 36,
            fill: '#FFD700',
            x: 0,
            y: 400,
            width: 1200,
            align: 'center'
        });
        this.layer.add(dotsText);
        // Bouton Annuler
        const buttonGroup = new Konva.Group({
            x: (1200 - 250) / 2,
            y: 500
        });
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
            text: "ANNULER",
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
            button.fill('#D18B00');
            button.shadowColor('#000000');
            button.shadowBlur(2);
            buttonText.y(28);
        });
        buttonGroup.on('mouseout', () => {
            button.fill('#FFB300');
            button.shadowColor('#FF8C00');
            button.shadowBlur(15);
            buttonText.y(22);
        });
        buttonGroup.on('click', () => {
            if (this.gameClient) {
                this.gameClient.cancelMatchmaking();
            }
        });
        this.layer.add(buttonGroup);
        // Animation des points
        const animate = () => {
            if (this.isDestroyed)
                return;
            const now = Date.now();
            if (now - this.lastDotUpdate > this.dotUpdateInterval) {
                this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
                dotsText.text(this.dots);
                this.lastDotUpdate = now;
                this.layer.batchDraw();
            }
            this.waitingAnimationFrame = requestAnimationFrame(animate);
        };
        animate();
        this.layer.draw();
    }
    stopWaitingScreen() {
        if (this.waitingAnimationFrame !== null) {
            cancelAnimationFrame(this.waitingAnimationFrame);
            this.waitingAnimationFrame = null;
        }
        this.dots = '';
        this.lastDotUpdate = 0;
        // Nettoyer le layer principal
        if (this.layer) {
            this.layer.destroyChildren();
        }
        // Réafficher les boutons de spawn
        if (this.buttonsLayer) {
            this.buttonsLayer.show();
        }
    }
}
