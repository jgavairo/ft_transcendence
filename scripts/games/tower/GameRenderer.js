// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
const buttonPosition = 400;
export class GameRenderer {
    initScene(state) {
        // Clear existing layers
        this.backgroundLayer.destroyChildren();
        this.uiLayer.destroyChildren();
        // Background and bases
        if (this.images.background) {
            this.backgroundLayer.add(new Konva.Image({
                image: this.images.background,
                width: 1200, height: 800, x: 0, y: 0
            }));
        }
        this.backgroundLayer.add(new Konva.Image({
            image: this.images.playerBase, x: -50, y: 330, scaleX: 0.5, scaleY: 0.5
        }));
        this.backgroundLayer.add(new Konva.Image({
            image: this.images.enemyBase, x: 1040, y: 330, scaleX: 0.5, scaleY: 0.5
        }));
        const barWidth = 250;
        const barHeight = 25;
        // Player HP Bar
        this.uiLayer.add(new Konva.Rect({
            x: 10, y: 15, width: barWidth, height: barHeight, fill: "#333", cornerRadius: 4
        }));
        this.playerHpBar = new Konva.Rect({
            x: 10, y: 15, width: barWidth, height: barHeight, fill: "red", cornerRadius: 4
        });
        this.uiLayer.add(this.playerHpBar);
        // Enemy HP Bar
        this.uiLayer.add(new Konva.Rect({
            x: 940, y: 15, width: barWidth, height: barHeight, fill: "#333", cornerRadius: 4
        }));
        this.enemyHpBar = new Konva.Rect({
            x: 940, y: 15, width: barWidth, height: barHeight, fill: "red", cornerRadius: 4
        });
        this.uiLayer.add(this.enemyHpBar);
        // Gold display
        this.uiLayer.add(new Konva.Image({
            image: this.images.coin, x: 10, y: 745, width: 48, height: 48
        }));
        this.playerGoldText = new Konva.Text({
            x: 55, y: 760, width: barWidth, fontFamily: "Press Start 2P",
            text: `...`, fontSize: 24, fontWeight: "bold", fill: "yellow"
        });
        this.uiLayer.add(this.playerGoldText);
        // Username displays
        this.uiLayer.add(new Konva.Text({
            x: 10, y: 60, width: barWidth, text: state.player.username,
            fontSize: 24, fontWeight: "bold", align: "center", fontFamily: "Press Start 2P",
            shadowColor: "#000", shadowBlur: 4, shadowOpacity: 0.5, fill: "white"
        }));
        this.uiLayer.add(new Konva.Text({
            x: 940, y: 60, width: barWidth, text: state.enemy.username,
            fontSize: 24, fontWeight: "bold", align: "center", fontFamily: "Press Start 2P",
            shadowColor: "#000", shadowBlur: 4, shadowOpacity: 0.5, fill: "white"
        }));
        this.backgroundLayer.draw();
        this.uiLayer.draw();
    }
    loadImages() {
        const paths = {
            background: '/assets/games/Tower/TowerBackground.webp',
            playerBase: '/assets/games/Tower/leftTower.webp',
            enemyBase: '/assets/games/Tower/rightTower.webp',
            coin: '/assets/games/Tower/coin.webp',
            endBackground: '/assets/games/Tower/endMatch.webp',
            waitingBackground: '/assets/games/Tower/waitingScreen.webp', // Add end image
            // Knight //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            knight_badge: '/assets/games/Tower/characters/knight/badge.webp',
            // -------------- Walk
            player_knight_walk: '/assets/games/Tower/characters/knight/knightWalkPlayer.webp',
            enemy_knight_walk: '/assets/games/Tower/characters/knight/knightWalkEnemy.webp',
            // -------------- Attack
            player_knight_attack: '/assets/games/Tower/characters/knight/knightAttackPlayer.webp',
            enemy_knight_attack: '/assets/games/Tower/characters/knight/knightAttackEnemy.webp',
            // -------------- Death
            player_knight_dead: '/assets/games/Tower/characters/knight/knightDeadPlayer.webp',
            enemy_knight_dead: '/assets/games/Tower/characters/knight/knightDeadEnemy.webp',
            // -------------- Idle
            player_knight_idle: '/assets/games/Tower/characters/knight/knightIdlePlayer.webp',
            enemy_knight_idle: '/assets/games/Tower/characters/knight/knightIdleEnemy.webp',
            // Archer //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            archer_badge: '/assets/games/Tower/characters/archer/badge.webp',
            // -------------- Walk
            player_archer_walk: '/assets/games/Tower/characters/archer/archerWalkPlayer.webp',
            enemy_archer_walk: '/assets/games/Tower/characters/archer/archerWalkEnemy.webp',
            // -------------- Attack
            player_archer_attack: '/assets/games/Tower/characters/archer/archerAttackPlayer.webp',
            enemy_archer_attack: '/assets/games/Tower/characters/archer/archerAttackEnemy.webp',
            // -------------- Death
            player_archer_dead: '/assets/games/Tower/characters/archer/archerDeadPlayer.webp',
            enemy_archer_dead: '/assets/games/Tower/characters/archer/archerDeadEnemy.webp',
            // -------------- Idle
            player_archer_idle: '/assets/games/Tower/characters/archer/archerIdlePlayer.webp',
            enemy_archer_idle: '/assets/games/Tower/characters/archer/archerIdleEnemy.webp',
            // Mage //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            mage_badge: '/assets/games/Tower/characters/mage/badge.webp',
            // -------------- Walk
            player_mage_walk: '/assets/games/Tower/characters/mage/mageWalkPlayer.webp',
            enemy_mage_walk: '/assets/games/Tower/characters/mage/mageWalkEnemy.webp',
            // -------------- Attack
            player_mage_attack: '/assets/games/Tower/characters/mage/mageAttackPlayer.webp',
            enemy_mage_attack: '/assets/games/Tower/characters/mage/mageAttackEnemy.webp',
            // -------------- Death
            player_mage_dead: '/assets/games/Tower/characters/mage/mageDeadPlayer.webp',
            enemy_mage_dead: '/assets/games/Tower/characters/mage/mageDeadEnemy.webp',
            // -------------- Idle
            player_mage_idle: '/assets/games/Tower/characters/mage/mageIdlePlayer.webp',
            enemy_mage_idle: '/assets/games/Tower/characters/mage/mageIdleEnemy.webp',
            // Minotaur //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            minotaur_badge: '/assets/games/Tower/characters/minotaur/badge.webp',
            // -------------- Walk
            player_minotaur_walk: '/assets/games/Tower/characters/minotaur/minotaurWalkPlayer.webp',
            enemy_minotaur_walk: '/assets/games/Tower/characters/minotaur/minotaurWalkEnemy.webp',
            // -------------- Attack
            player_minotaur_attack: '/assets/games/Tower/characters/minotaur/minotaurAttackPlayer.webp',
            enemy_minotaur_attack: '/assets/games/Tower/characters/minotaur/minotaurAttackEnemy.webp',
            // -------------- Death
            player_minotaur_dead: '/assets/games/Tower/characters/minotaur/minotaurDeadPlayer.webp',
            enemy_minotaur_dead: '/assets/games/Tower/characters/minotaur/minotaurDeadEnemy.webp',
            // -------------- Idle
            player_minotaur_idle: '/assets/games/Tower/characters/minotaur/minotaurIdlePlayer.webp',
            enemy_minotaur_idle: '/assets/games/Tower/characters/minotaur/minotaurIdleEnemy.webp',
            // Samourai //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            samourai_badge: '/assets/games/Tower/characters/samourai/badge.webp',
            // -------------- Walk
            player_samourai_walk: '/assets/games/Tower/characters/samourai/samouraiWalkPlayer.webp',
            enemy_samourai_walk: '/assets/games/Tower/characters/samourai/samouraiWalkEnemy.webp',
            // -------------- Attack
            player_samourai_attack: '/assets/games/Tower/characters/samourai/samouraiAttackPlayer.webp',
            enemy_samourai_attack: '/assets/games/Tower/characters/samourai/samouraiAttackEnemy.webp',
            // -------------- Death
            player_samourai_dead: '/assets/games/Tower/characters/samourai/samouraiDeadPlayer.webp',
            enemy_samourai_dead: '/assets/games/Tower/characters/samourai/samouraiDeadEnemy.webp',
            // -------------- Idle
            player_samourai_idle: '/assets/games/Tower/characters/samourai/samouraiIdlePlayer.webp',
            enemy_samourai_idle: '/assets/games/Tower/characters/samourai/samouraiIdleEnemy.webp',
            // samouraiArcher //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            samouraiArcher_badge: '/assets/games/Tower/characters/samouraiArcher/badge.webp',
            // -------------- Walk
            player_samouraiArcher_walk: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherWalkPlayer.webp',
            enemy_samouraiArcher_walk: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherWalkEnemy.webp',
            // -------------- Attack
            player_samouraiArcher_attack: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherAttackPlayer.webp',
            enemy_samouraiArcher_attack: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherAttackEnemy.webp',
            // -------------- Death
            player_samouraiArcher_dead: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherDeadPlayer.webp',
            enemy_samouraiArcher_dead: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherDeadEnemy.webp',
            // -------------- Idle
            player_samouraiArcher_idle: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherIdlePlayer.webp',
            enemy_samouraiArcher_idle: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherIdleEnemy.webp'
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
    constructor(canvasId, gameClient) {
        this.buttons = []; // To store buttons
        this.unitNodes = new Map();
        this.playerHpBar = null;
        this.enemyHpBar = null;
        this.playerGoldText = null;
        this.isDestroyed = false;
        this.cooldownAnimationIds = [];
        this.buttonCooldowns = new Map();
        this.cooldownDuration = 2000; // 2 seconds in milliseconds
        this.cooldownSize = 15; // Reduced cooldown circle size
        this.playerSide = 'player';
        this.matchIsEnded = false;
        this.animationFrame = 0;
        this.lastAnimationFrame = 0;
        this.animationSpeed = 120;
        this.deathAnimationSpeed = 300; // Slower death animation
        this.frameCount = 8; // All animations now have 8 frames
        this.frameWidth = 128;
        this.frameHeight = 128;
        this.images = {};
        // Map to track death frames and their timing
        this.deathAnimationFrames = new Map();
        this.waitingAnimationFrame = null;
        this.dots = '';
        this.lastDotUpdate = 0;
        this.dotUpdateInterval = 500; // Update dots every 500ms
        this.isInitialized = false;
        this.gameClient = gameClient;
        this.stage = new Konva.Stage({
            container: canvasId,
            width: 1200,
            height: 800
        });
        this.backgroundLayer = new Konva.Layer();
        this.unitsLayer = new Konva.Layer();
        this.uiLayer = new Konva.Layer();
        this.buttonsLayer = new Konva.Layer();
        this.stage.add(this.backgroundLayer, this.unitsLayer, this.uiLayer, this.buttonsLayer);
    }
    initialize() {
        return this.loadImages().then(() => {
            this.createUnitButtons();
        });
    }
    handleButtonCooldown(button, image) {
        if (this.isDestroyed) {
            return;
        }
        if (this.buttonCooldowns.get(button)) {
            return;
        }
        this.buttonCooldowns.set(button, true);
        // Create group for cooldown
        const cooldownGroup = new Konva.Group({
            x: image.x() - image.width() / 2 + 10, // 10px offset from edge
            y: image.y() - image.height() / 2 + 10 // 10px offset from edge
        });
        // Progress arc (full circle)
        const cooldownArc = new Konva.Arc({
            innerRadius: 0, // Start at center for full circle
            outerRadius: Math.max(0, this.cooldownSize / 2),
            angle: 0,
            rotation: -90,
            fill: '#32CD32',
            opacity: 1
        });
        cooldownGroup.add(cooldownArc);
        button.add(cooldownGroup);
        // Apply grayscale effect to button
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
                // Animation finished
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
        if (this.images.archer_badge && this.images.knight_badge && this.images.mage_badge) {
            const buttonHeight = 1024 * 0.09;
            const buttonWidth = 768 * 0.09;
            // Bouton Archer
            const archerButton = new Konva.Group();
            const archerImage = new Konva.Image({
                image: this.images.archer_badge,
                x: buttonPosition,
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
                    const spawnSuccess = this.gameClient.spawnUnit('archer');
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
            // Adjust position to account for new origin point
            archerImage.x(buttonPosition + buttonWidth / 2);
            archerImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(archerButton);
            this.buttons.push(archerButton);
            // Bouton Knight
            const knightButton = new Konva.Group();
            const knightImage = new Konva.Image({
                image: this.images.knight_badge,
                x: buttonPosition + buttonSpacing,
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
                    const spawnSuccess = this.gameClient.spawnUnit('knight');
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
            // Adjust position to account for new origin point
            knightImage.x(buttonPosition + buttonSpacing + buttonWidth / 2);
            knightImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(knightButton);
            this.buttons.push(knightButton);
            // Bouton Mage
            const mageButton = new Konva.Group();
            const mageImage = new Konva.Image({
                image: this.images.mage_badge,
                x: buttonPosition + (buttonSpacing * 2),
                y: buttonY,
                height: buttonHeight,
                width: buttonWidth,
                offsetX: buttonWidth / 2,
                offsetY: buttonHeight / 2
            });
            mageButton.add(mageImage);
            this.buttonCooldowns.set(mageButton, false);
            mageButton.on('click', () => {
                if (!this.buttonCooldowns.get(mageButton)) {
                    const spawnSuccess = this.gameClient.spawnUnit('mage');
                    if (spawnSuccess) {
                        this.handleButtonCooldown(mageButton, mageImage);
                    }
                }
            });
            mageButton.on('mouseover', () => {
                if (!this.buttonCooldowns.get(mageButton)) {
                    document.body.style.cursor = 'pointer';
                    mageImage.scale({ x: 1.1, y: 1.1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            mageButton.on('mouseout', () => {
                if (!this.buttonCooldowns.get(mageButton)) {
                    document.body.style.cursor = 'default';
                    mageImage.scale({ x: 1, y: 1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            // Adjust position to account for new origin point
            mageImage.x(buttonPosition + (buttonSpacing * 2) + buttonWidth / 2);
            mageImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(mageButton);
            this.buttons.push(mageButton);
            // Bouton Minotaur
            const minotaurButton = new Konva.Group();
            const minotaurImage = new Konva.Image({
                image: this.images.minotaur_badge,
                x: buttonPosition + (buttonSpacing * 3),
                y: buttonY,
                height: buttonHeight,
                width: buttonWidth,
                offsetX: buttonWidth / 2,
                offsetY: buttonHeight / 2
            });
            minotaurButton.add(minotaurImage);
            this.buttonCooldowns.set(minotaurButton, false);
            minotaurButton.on('click', () => {
                if (!this.buttonCooldowns.get(minotaurButton)) {
                    const spawnSuccess = this.gameClient.spawnUnit('minotaur');
                    if (spawnSuccess) {
                        this.handleButtonCooldown(minotaurButton, minotaurImage);
                    }
                }
            });
            minotaurButton.on('mouseover', () => {
                if (!this.buttonCooldowns.get(minotaurButton)) {
                    document.body.style.cursor = 'pointer';
                    minotaurImage.scale({ x: 1.1, y: 1.1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            minotaurButton.on('mouseout', () => {
                if (!this.buttonCooldowns.get(minotaurButton)) {
                    document.body.style.cursor = 'default';
                    minotaurImage.scale({ x: 1, y: 1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            // Adjust position to account for new origin point
            minotaurImage.x(buttonPosition + (buttonSpacing * 3) + buttonWidth / 2);
            minotaurImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(minotaurButton);
            this.buttons.push(minotaurButton);
            // Bouton Samourai
            const samouraiButton = new Konva.Group();
            const samouraiImage = new Konva.Image({
                image: this.images.samourai_badge,
                x: buttonPosition + (buttonSpacing * 4),
                y: buttonY,
                height: buttonHeight,
                width: buttonWidth,
                offsetX: buttonWidth / 2,
                offsetY: buttonHeight / 2
            });
            samouraiButton.add(samouraiImage);
            this.buttonCooldowns.set(samouraiButton, false);
            samouraiButton.on('click', () => {
                if (!this.buttonCooldowns.get(samouraiButton)) {
                    const spawnSuccess = this.gameClient.spawnUnit('samourai');
                    if (spawnSuccess) {
                        this.handleButtonCooldown(samouraiButton, samouraiImage);
                    }
                }
            });
            samouraiButton.on('mouseover', () => {
                if (!this.buttonCooldowns.get(samouraiButton)) {
                    document.body.style.cursor = 'pointer';
                    samouraiImage.scale({ x: 1.1, y: 1.1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            samouraiButton.on('mouseout', () => {
                if (!this.buttonCooldowns.get(samouraiButton)) {
                    document.body.style.cursor = 'default';
                    samouraiImage.scale({ x: 1, y: 1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            // Adjust position to account for new origin point
            samouraiImage.x(buttonPosition + (buttonSpacing * 4) + buttonWidth / 2);
            samouraiImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(samouraiButton);
            this.buttons.push(samouraiButton);
            // Bouton Samourai Archer
            const samouraiArcherButton = new Konva.Group();
            const samouraiArcherImage = new Konva.Image({
                image: this.images.samouraiArcher_badge,
                x: buttonPosition + (buttonSpacing * 5),
                y: buttonY,
                height: buttonHeight,
                width: buttonWidth,
                offsetX: buttonWidth / 2,
                offsetY: buttonHeight / 2
            });
            samouraiArcherButton.add(samouraiArcherImage);
            this.buttonCooldowns.set(samouraiArcherButton, false);
            samouraiArcherButton.on('click', () => {
                if (!this.buttonCooldowns.get(samouraiArcherButton)) {
                    const spawnSuccess = this.gameClient.spawnUnit('samouraiArcher');
                    if (spawnSuccess) {
                        this.handleButtonCooldown(samouraiArcherButton, samouraiArcherImage);
                    }
                }
            });
            samouraiArcherButton.on('mouseover', () => {
                if (!this.buttonCooldowns.get(samouraiArcherButton)) {
                    document.body.style.cursor = 'pointer';
                    samouraiArcherImage.scale({ x: 1.1, y: 1.1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            samouraiArcherButton.on('mouseout', () => {
                if (!this.buttonCooldowns.get(samouraiArcherButton)) {
                    document.body.style.cursor = 'default';
                    samouraiArcherImage.scale({ x: 1, y: 1 });
                    this.buttonsLayer.batchDraw();
                }
            });
            // Adjust position to account for new origin point
            samouraiArcherImage.x(buttonPosition + (buttonSpacing * 5) + buttonWidth / 2);
            samouraiArcherImage.y(buttonY + buttonHeight / 2);
            this.buttonsLayer.add(samouraiArcherButton);
            this.buttons.push(samouraiArcherButton);
        }
    }
    cleanup() {
        if (this.isDestroyed)
            return; // Avoid double cleanup
        this.isDestroyed = true;
        this.matchIsEnded = true;
        // Reset cursor to default
        document.body.style.cursor = 'default';
        // Stop all ongoing animations
        this.cooldownAnimationIds.forEach(id => cancelAnimationFrame(id));
        this.cooldownAnimationIds = [];
        // Remove all event listeners from buttons
        this.buttons.forEach(button => {
            button.off('mouseover mouseout click');
        });
        // Clean up maps and arrays BEFORE destroying layers
        this.buttons = [];
        this.buttonCooldowns.clear();
        this.deathAnimationFrames.clear();
        this.unitNodes.clear();
        try {
            // Destroy layers in order
            if (this.buttonsLayer) {
                this.buttonsLayer.destroyChildren();
                this.buttonsLayer.destroy();
            }
            if (this.unitsLayer) {
                this.unitsLayer.destroyChildren();
                this.unitsLayer.destroy();
            }
            if (this.uiLayer) {
                this.uiLayer.destroyChildren();
                this.uiLayer.destroy();
            }
            if (this.backgroundLayer) {
                this.backgroundLayer.destroyChildren();
                this.backgroundLayer.destroy();
            }
            // Destroy stage last
            if (this.stage) {
                this.stage.destroyChildren();
                this.stage.destroy();
            }
        }
        catch (error) {
            console.error("Error during cleanup:", error);
        }
        // Ensure references are null
        this.buttonsLayer = null;
        this.uiLayer = null;
        this.unitsLayer = null;
        this.backgroundLayer = null;
        this.stage = null;
    }
    render(state) {
        if (this.isDestroyed || !this.stage) {
            return;
        }
        if (!this.isInitialized) {
            this.initScene(state);
            this.isInitialized = true;
        }
        if (this.matchIsEnded) {
            return;
        }
        const now = Date.now();
        if (now - this.lastAnimationFrame > this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % this.frameCount;
            this.lastAnimationFrame = now;
        }
        // --- UPDATE UI ---
        const barWidth = 250;
        const maxHP = 500;
        this.playerHpBar.width(Math.max(0, barWidth * (state.player.tower / maxHP)));
        this.enemyHpBar.width(Math.max(0, barWidth * (state.enemy.tower / maxHP)));
        this.playerGoldText.text(`${Math.floor(this.playerSide === 'player' ? state.player.gold : state.enemy.gold)}`);
        // --- SYNCHRONIZE UNITS ---
        const allUnitIdsInState = new Set();
        const allUnits = [...state.player.units, ...state.enemy.units];
        allUnits.forEach(unit => allUnitIdsInState.add(unit.id));
        // Update existing units and add new ones
        allUnits.forEach((unit) => {
            let unitNode = this.unitNodes.get(unit.id);
            if (!unitNode) {
                unitNode = new Konva.Image({
                    width: this.frameWidth,
                    height: this.frameHeight,
                });
                this.unitNodes.set(unit.id, unitNode);
                this.unitsLayer.add(unitNode);
            }
            // Determine correct image key
            const team = state.player.units.some((u) => u.id === unit.id) ? 'player' : 'enemy';
            let imageKey = `${team}_${unit.imgKey}`;
            if (unit.state === 'attacking')
                imageKey = `${team}_${unit.attackImgKey}`;
            else if (unit.state === 'idle')
                imageKey = `${team}_${unit.idleImgKey}`;
            else if (unit.state === 'dead')
                imageKey = `${team}_${unit.deadImgKey}`;
            // Handle animation frame
            let currentFrame = this.animationFrame;
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
            // Update node properties
            unitNode.image(this.images[imageKey]);
            unitNode.position({ x: unit.x, y: unit.y });
            unitNode.crop({
                x: currentFrame * this.frameWidth,
                y: 0,
                width: this.frameWidth,
                height: this.frameHeight
            });
        });
        // Remove units that are no longer in the state
        this.unitNodes.forEach((node, unitId) => {
            if (!allUnitIdsInState.has(unitId)) {
                node.destroy();
                this.unitNodes.delete(unitId);
                this.deathAnimationFrames.delete(unitId);
            }
        });
        // --- HANDLE MATCH END ---
        if (state.player.tower <= 0 || state.enemy.tower <= 0) {
            this.matchIsEnded = true;
            const winner = state.player.tower <= 0 ? state.enemy.username : state.player.username;
            this.showEndScreen(winner);
            return;
        }
        this.stage.batchDraw();
    }
    showEndScreen(winner) {
        // Hide game layers
        this.unitsLayer.hide();
        this.uiLayer.hide();
        this.buttonsLayer.hide();
        const endLayer = new Konva.Layer();
        // Add background
        if (this.images.endBackground) {
            endLayer.add(new Konva.Image({
                image: this.images.endBackground,
                width: 1200, height: 800, opacity: 0.9
            }));
        }
        else {
            endLayer.add(new Konva.Rect({
                width: 1200, height: 800, fill: 'black', opacity: 0.9
            }));
        }
        // Add winner text
        endLayer.add(new Konva.Text({
            text: `${winner} WINS!`,
            fontFamily: 'Press Start 2P', fontSize: 48, fill: '#FFD700',
            x: 0, y: 300, width: 1200, align: 'center',
            shadowColor: '#000', shadowBlur: 10, shadowOffset: { x: 5, y: 5 }, shadowOpacity: 0.5
        }));
        // Create button to return to menu
        const buttonGroup = new Konva.Group({ x: (1200 - 250) / 2, y: 450 });
        const button = new Konva.Rect({
            width: 250, height: 70, fill: "#FFB300", cornerRadius: 10,
            stroke: '#6B3F16', strokeWidth: 4, shadowColor: "#FF8C00", shadowBlur: 15, shadowOpacity: 0.4
        });
        const buttonText = new Konva.Text({
            text: "QUIT", fontFamily: "Press Start 2P", fontSize: 22, fontWeight: "bold",
            fill: "#6B3F16", align: 'center', width: 250, height: 70, y: 22
        });
        buttonGroup.add(button, buttonText);
        buttonGroup.on('click', () => this.gameClient.quitMatch(false));
        buttonGroup.on('mouseover', () => {
            button.fill('#D18B00');
            document.body.style.cursor = 'pointer';
        });
        buttonGroup.on('mouseout', () => {
            button.fill('#FFB300');
            document.body.style.cursor = 'default';
        });
        endLayer.add(buttonGroup);
        this.stage.add(endLayer);
        endLayer.draw();
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
        if (this.isDestroyed || !this.unitsLayer || !this.stage)
            return;
        this.unitsLayer.destroyChildren();
        this.buttonsLayer.hide();
        // Semi-transparent black background
        const background = new Konva.Image({
            image: this.images.waitingBackground,
            width: 1200,
            height: 800,
            opacity: 1
        });
        this.unitsLayer.add(background);
        // Text "Searching for an opponent"
        const waitingText = new Konva.Text({
            text: "Searching for an opponent",
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
        this.unitsLayer.add(waitingText);
        // Animated dots
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
        this.unitsLayer.add(dotsText);
        // Cancel button
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
            text: "CANCEL",
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
        this.unitsLayer.add(buttonGroup);
        // Dots animation
        const animate = () => {
            if (this.isDestroyed)
                return;
            const now = Date.now();
            if (now - this.lastDotUpdate > this.dotUpdateInterval) {
                this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
                dotsText.text(this.dots);
                this.lastDotUpdate = now;
                this.unitsLayer.batchDraw();
            }
            this.waitingAnimationFrame = requestAnimationFrame(animate);
        };
        animate();
        this.unitsLayer.draw();
    }
    stopWaitingScreen() {
        if (this.waitingAnimationFrame !== null) {
            cancelAnimationFrame(this.waitingAnimationFrame);
            this.waitingAnimationFrame = null;
        }
        this.dots = '';
        this.lastDotUpdate = 0;
        // Clear main layer
        if (this.unitsLayer) {
            this.unitsLayer.destroyChildren();
        }
        // Redisplay spawn buttons
        if (this.buttonsLayer) {
            this.buttonsLayer.show();
        }
    }
}
