// @ts-ignore
import Konva from "https://cdn.skypack.dev/konva";
import { socket } from "../pong/network";

const buttonPosition = 400;

export class GameRenderer {
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private buttonsLayer: Konva.Layer;  // New layer for buttons
    private buttons: Konva.Group[] = []; // To store buttons

    private isDestroyed: boolean = false;
    private cooldownAnimationIds: number[] = [];
    private buttonCooldowns: Map<Konva.Group, boolean> = new Map();
    private cooldownDuration: number = 2000; // 2 seconds in milliseconds
    private cooldownSize: number = 15; // Reduced cooldown circle size
    private playerSide: 'player' | 'enemy' = 'player';
    
    public matchIsEnded: boolean = false;

    private animationFrame: number = 0;
    private lastAnimationFrame: number = 0;
    private animationSpeed: number = 120;
    private deathAnimationSpeed: number = 300;  // Slower death animation
    private frameCount: number = 8;  // All animations now have 8 frames
        
    private frameWidth: number = 128;
    private frameHeight: number = 128;

    private images: { [key: string]: HTMLImageElement } = {};
    private gameClient: any;  // To store reference to GameClient
    
    // Map to track death frames and their timing
    private deathAnimationFrames: Map<string, { frame: number, lastUpdate: number }> = new Map();

    private waitingAnimationFrame: number | null = null;
    private dots: string = '';
    private lastDotUpdate: number = 0;
    private dotUpdateInterval: number = 500; // Update dots every 500ms

    private loadImages(): Promise<void>
    {
        const paths = 
        {
            background: '/assets/games/Tower/TowerBackground.png',
            playerBase: '/assets/games/Tower/leftTower.png',
            enemyBase: '/assets/games/Tower/rightTower.png',
            coin: '/assets/games/Tower/coin.png',
            endBackground: '/assets/games/Tower/endMatch.png',
            waitingBackground: '/assets/games/Tower/waitingScreen.png',  // Add end image

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
            enemy_archer_idle: '/assets/games/Tower/characters/archer/archerIdleEnemy.png',
            // Mage //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            mage_badge: '/assets/games/Tower/characters/mage/badge.png',
            // -------------- Walk
            player_mage_walk: '/assets/games/Tower/characters/mage/mageWalkPlayer.png',
            enemy_mage_walk: '/assets/games/Tower/characters/mage/mageWalkEnemy.png',
            // -------------- Attack
            player_mage_attack: '/assets/games/Tower/characters/mage/mageAttackPlayer.png',
            enemy_mage_attack: '/assets/games/Tower/characters/mage/mageAttackEnemy.png',
            // -------------- Death
            player_mage_dead: '/assets/games/Tower/characters/mage/mageDeadPlayer.png',
            enemy_mage_dead: '/assets/games/Tower/characters/mage/mageDeadEnemy.png',
            // -------------- Idle
            player_mage_idle: '/assets/games/Tower/characters/mage/mageIdlePlayer.png',
            enemy_mage_idle: '/assets/games/Tower/characters/mage/mageIdleEnemy.png',
            // Minotaur //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            minotaur_badge: '/assets/games/Tower/characters/minotaur/badge.png',
            // -------------- Walk
            player_minotaur_walk: '/assets/games/Tower/characters/minotaur/minotaurWalkPlayer.png',
            enemy_minotaur_walk: '/assets/games/Tower/characters/minotaur/minotaurWalkEnemy.png',
            // -------------- Attack
            player_minotaur_attack: '/assets/games/Tower/characters/minotaur/minotaurAttackPlayer.png',
            enemy_minotaur_attack: '/assets/games/Tower/characters/minotaur/minotaurAttackEnemy.png',
            // -------------- Death
            player_minotaur_dead: '/assets/games/Tower/characters/minotaur/minotaurDeadPlayer.png',
            enemy_minotaur_dead: '/assets/games/Tower/characters/minotaur/minotaurDeadEnemy.png',
            // -------------- Idle
            player_minotaur_idle: '/assets/games/Tower/characters/minotaur/minotaurIdlePlayer.png',
            enemy_minotaur_idle: '/assets/games/Tower/characters/minotaur/minotaurIdleEnemy.png',
            // Samourai //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            samourai_badge: '/assets/games/Tower/characters/samourai/badge.png',
            // -------------- Walk
            player_samourai_walk: '/assets/games/Tower/characters/samourai/samouraiWalkPlayer.png',
            enemy_samourai_walk: '/assets/games/Tower/characters/samourai/samouraiWalkEnemy.png',
            // -------------- Attack
            player_samourai_attack: '/assets/games/Tower/characters/samourai/samouraiAttackPlayer.png',
            enemy_samourai_attack: '/assets/games/Tower/characters/samourai/samouraiAttackEnemy.png',
            // -------------- Death
            player_samourai_dead: '/assets/games/Tower/characters/samourai/samouraiDeadPlayer.png',
            enemy_samourai_dead: '/assets/games/Tower/characters/samourai/samouraiDeadEnemy.png',
            // -------------- Idle
            player_samourai_idle: '/assets/games/Tower/characters/samourai/samouraiIdlePlayer.png',
            enemy_samourai_idle: '/assets/games/Tower/characters/samourai/samouraiIdleEnemy.png',
            // samouraiArcher //////////////////////////////////////////////////////////////////////
            //
            // -------------- Badge
            samouraiArcher_badge: '/assets/games/Tower/characters/samouraiArcher/badge.png',
            // -------------- Walk
            player_samouraiArcher_walk: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherWalkPlayer.png',
            enemy_samouraiArcher_walk: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherWalkEnemy.png',
            // -------------- Attack
            player_samouraiArcher_attack: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherAttackPlayer.png',
            enemy_samouraiArcher_attack: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherAttackEnemy.png',
            // -------------- Death
            player_samouraiArcher_dead: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherDeadPlayer.png',
            enemy_samouraiArcher_dead: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherDeadEnemy.png',
            // -------------- Idle
            player_samouraiArcher_idle: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherIdlePlayer.png',
            enemy_samouraiArcher_idle: '/assets/games/Tower/characters/samouraiArcher/samouraiArcherIdleEnemy.png'
        };
        const promises = Object.entries(paths).map(([key, src]) => 
        {
            return new Promise<void>((resolve) =>
            {
                const img = new window.Image();
                img.src = src;
                img.onload = () =>
                {
                    this.images[key] = img;
                    resolve();
                };
            });
        });
        return Promise.all(promises).then(() => {});
    }

    constructor(canvasId: string, gameClient: any) 
    {
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
    
    private handleButtonCooldown(button: Konva.Group, image: Konva.Image) {
        if (this.isDestroyed)
        {
            return;
        }
        if (this.buttonCooldowns.get(button)) {
            return;
        }

        this.buttonCooldowns.set(button, true);

        // Create group for cooldown
        const cooldownGroup = new Konva.Group({
            x: image.x() - image.width() / 2 + 10,  // 10px offset from edge
            y: image.y() - image.height() / 2 + 10  // 10px offset from edge
        });

        // Progress arc (full circle)
        const cooldownArc = new Konva.Arc({
            innerRadius: 0,  // Start at center for full circle
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
            } else {
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

    private createUnitButtons() {
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
                if (!this.buttonCooldowns.get(archerButton))
                {
                    const spawnSuccess = this.gameClient.spawnUnit('archer');
                    if (spawnSuccess) 
                    {
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
    
    public cleanup() {
        if (this.isDestroyed) return;  // Avoid double cleanup
        
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
        
        try {
            // Destroy layers in order
            if (this.buttonsLayer) {
                this.buttonsLayer.destroyChildren();
                this.buttonsLayer.destroy();
            }
            if (this.layer) {
                this.layer.destroyChildren();
                this.layer.destroy();
            }
            
            // Destroy stage last
            if (this.stage) {
                this.stage.destroyChildren();
                this.stage.destroy();
            }
        } catch (error) {
            console.error("Error during cleanup:", error);
        }
        
        // Ensure references are null
        this.buttonsLayer = null;
        this.layer = null;
        this.stage = null;
    }

    public render(state: any) 
    {
        if (this.isDestroyed || !this.layer || !this.stage) {
            return;
        }

        if (this.matchIsEnded)
        {
            return;
        }

        this.layer.destroyChildren();
        
        const now = Date.now();
        if (now - this.lastAnimationFrame > this.animationSpeed)
        {
            this.animationFrame = (this.animationFrame + 1) % this.frameCount;
            this.lastAnimationFrame = now;
        }

        
            
        // Cleaning up dead units from the Map
        this.deathAnimationFrames.forEach((_, unitId) => {
            const unitExists = [...state.player.units, ...state.enemy.units].some(unit => unit.id === unitId);
            if (!unitExists) {
                this.deathAnimationFrames.delete(unitId);
            }
        });
            
        if (this.images.background)
        {
            this.layer.add(new Konva.Image
            ({
                image: this.images.background,
                width: 1200,
                height: 800,
                x: 0,
                y: 0
            }));
        }

        // Display player base
        this.layer.add(new Konva.Image
        ({
            image: this.images.playerBase,
            x: -50,
            y: 330,
            scaleX: 0.5,
            scaleY: 0.5
        }));
        // Display enemy base
        this.layer.add(new Konva.Image
        ({
            image: this.images.enemyBase,
            x: 1040,
            y: 330,
            scaleX: 0.5,
            scaleY: 0.5
        }));

        // Display player units
        state.player.units.forEach((unit: any) => 
        {
            let currentFrame = this.animationFrame;
            
            // Special handling for death animation
            if (unit.state === 'dead') {
                if (!this.deathAnimationFrames.has(unit.id)) {
                    this.deathAnimationFrames.set(unit.id, { frame: 0, lastUpdate: now });
                }
                
                const deathAnim = this.deathAnimationFrames.get(unit.id)!;
                if (now - deathAnim.lastUpdate > this.deathAnimationSpeed) {
                    if (deathAnim.frame < this.frameCount - 1) {
                        deathAnim.frame++;
                        deathAnim.lastUpdate = now;
                    }
                }
                currentFrame = deathAnim.frame;
            }

            this.layer.add(new Konva.Image
            ({
                x: unit.x,
                y: unit.y,
                image: this.images[`player_${unit.state === 'attacking' ? unit.attackImgKey : 
                                           unit.state === 'idle' ? unit.idleImgKey :
                                           unit.state === 'dead' ? unit.deadImgKey :
                                           unit.imgKey}`],
                width: this.frameWidth,
                height: this.frameHeight,
                crop:
                {
                    x: currentFrame * this.frameWidth,
                    y: 0,
                    width: this.frameWidth,
                    height: this.frameHeight
                }
            }));
        });

        // Display enemy units
        state.enemy.units.forEach((unit: any) => 
        {
            let currentFrame = this.animationFrame;
            
            // Special handling for death animation
            if (unit.state === 'dead') {
                if (!this.deathAnimationFrames.has(unit.id)) {
                    this.deathAnimationFrames.set(unit.id, { frame: 0, lastUpdate: now });
                }
                
                const deathAnim = this.deathAnimationFrames.get(unit.id)!;
                if (now - deathAnim.lastUpdate > this.deathAnimationSpeed) {
                    if (deathAnim.frame < this.frameCount - 1) {
                        deathAnim.frame++;
                        deathAnim.lastUpdate = now;
                    }
                }
                currentFrame = deathAnim.frame;
            }

            this.layer.add(new Konva.Image
            ({
                x: unit.x,
                y: unit.y,
                image: this.images[`enemy_${unit.state === 'attacking' ? unit.attackImgKey : 
                                          unit.state === 'idle' ? unit.idleImgKey :
                                          unit.state === 'dead' ? unit.deadImgKey :
                                          unit.imgKey}`],
                width: this.frameWidth,
                height: this.frameHeight,
                crop:
                {
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

        if (playerHP <= 0 || enemyHP <= 0)
        {
            this.matchIsEnded = true;
            const winner = playerHP <= 0 ? state.enemy.username : state.player.username;
            
            // Clear screen
            this.layer.destroyChildren();
            this.buttonsLayer.destroyChildren();

            // Add background
            if (this.images.endBackground) {
                const background = new Konva.Image({
                    image: this.images.endBackground,
                    width: 1200,
                    height: 800,
                    opacity: 0.9
                });
                this.layer.add(background);
            } else {
                // Fallback to black rectangle if image not loaded
                const background = new Konva.Rect({
                    width: 1200,
                    height: 800,
                    fill: 'black',
                    opacity: 0.9
                });
                this.layer.add(background);
            }

            // Add winner text
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

            // Create button to return to menu
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
                button.fill('#D18B00');           // Darker yellow/brown (pressed effect)
                button.stroke('#6B3F16');         // Keep dark outline
                button.shadowColor('#000000');    // Very subtle or no shadow
                button.shadowBlur(2);
                buttonText.fill('#6B3F16');       // Keep text dark
                buttonText.y(28);                 // Move text down (pressed effect)
            });

            buttonGroup.on('mouseout', () => {
                button.fill('#FFB300');           // Normal golden yellow
                button.stroke('#6B3F16');
                button.shadowColor('#FF8C00');
                button.shadowBlur(15);
                buttonText.fill('#6B3F16');
                buttonText.y(22);
            });

            buttonGroup.on('click', () => {
                this.gameClient.quitMatch(false);
            });

            this.layer.add(buttonGroup);
            this.layer.draw();
            return;
        }
            
        const barWidth = 250;
        const barHeight = 25;

        const playerHPWidth = Math.max(0, barWidth * (playerHP / maxPlayerHP));
        const enemyHPWidth = Math.max(0, barWidth * (enemyHP / maxEnemyHP));

        this.layer.add(new Konva.Rect
        ({
            x: 10,
            y: 15,
            width: barWidth,
            height: barHeight,
            fill: "#333",
            cornerRadius: 4
        }));
        
        this.layer.add(new Konva.Rect
        ({
            x: 10,
            y: 15,
            width: playerHPWidth,
            height: barHeight,
            fill: "red",
            cornerRadius: 4
        }));
        
        this.layer.add(new Konva.Rect
        ({
            x: 940,
            y: 15,
            width: barWidth,
            height: barHeight,
            fill: "#333",
            cornerRadius: 4
        }));
        
        this.layer.add(new Konva.Rect
        ({
            x: 940,
            y: 15,
            width: enemyHPWidth,
            height: barHeight,
            fill: "red",
            cornerRadius: 4
        }));

        // Display gold and HP
        this.layer.add(new Konva.Image
        ({
            image: this.images.coin,
            x: 10,
            y: 745,
            width: 48,
            height: 48
        }));
        this.layer.add(new Konva.Text
        ({
            x: 55,
            y: 760,
            width: barWidth,
            fontFamily: "Press Start 2P",
            text: `${Math.floor(this.playerSide === 'player' ? state.player.gold : state.enemy.gold)}`,
            fontSize: 24,
            fontWeight: "bold",
            fill: "yellow"
        }));
        
        this.layer.add(new Konva.Text
        ({
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

        this.layer.add(new Konva.Text
        ({
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

    public getStage(): Konva.Stage {
        return this.stage;
    }

    public setPlayerSide(side: 'player' | 'enemy') {
        this.playerSide = side;
    }

    public getPlayerSide(): 'player' | 'enemy' {
        return this.playerSide;
    }

    public showWaitingScreen() 
    {
        if (this.isDestroyed || !this.layer || !this.stage) 
            return;

        this.layer.destroyChildren();

        this.buttonsLayer.hide();

        // Semi-transparent black background
        const background = new Konva.Image({
            image: this.images.waitingBackground,
            width: 1200,
            height: 800,
            opacity: 1
        });
        this.layer.add(background);

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
        this.layer.add(waitingText);

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
        this.layer.add(dotsText);

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

        this.layer.add(buttonGroup);

        // Dots animation
        const animate = () => {
            if (this.isDestroyed) return;

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

    public stopWaitingScreen() 
    {
        if (this.waitingAnimationFrame !== null) {
            cancelAnimationFrame(this.waitingAnimationFrame);
            this.waitingAnimationFrame = null;
        }
        this.dots = '';
        this.lastDotUpdate = 0;
        
        // Clear main layer
        if (this.layer)
        {
            this.layer.destroyChildren();
        }
        // Redisplay spawn buttons
        if (this.buttonsLayer) 
        {
            this.buttonsLayer.show();
        }
    }
}
