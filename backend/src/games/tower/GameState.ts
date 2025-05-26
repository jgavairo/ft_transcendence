import { GameState, PlayerState, Unit, UnitType } from "./types/types.js";
import { GAME_CONFIG } from "./config.js";
import { userSocketMapTower } from "../../server.js";

export class Game
{
    private socketPlayerOne: string;
    private socketPlayerTwo: string;
    private isMultiplayer: boolean;
    private state: GameState;
    private lastTick: number;

    private aiTimer: number = 0;

    constructor(socketPlayerOne: string, socketPlayerTwo: string, isMultiplayer: boolean)
    {
        this.socketPlayerOne = socketPlayerOne;
        this.socketPlayerTwo = socketPlayerTwo;
        this.isMultiplayer = isMultiplayer;
        console.log("socketPlayerOne:", socketPlayerOne);
        console.log("userSocketMapTower.get(socketPlayerOne):", userSocketMapTower.get(socketPlayerOne));
        this.state =
        {
            player:
            {
                username: userSocketMapTower.get(socketPlayerOne) || "Player One",
                gold: 100,
                tower: GAME_CONFIG.TOWER_HP,
                units: [],
            },
            enemy:
            {
                username: isMultiplayer ? userSocketMapTower.get(socketPlayerTwo) || "Player Two" : "BOT",
                gold: 100,
                tower: GAME_CONFIG.TOWER_HP,
                units: [],
            },
            finish: false,
            winner: ""
        };
        this.lastTick = Date.now();
    }

    public updateAI(delta: number): void {
        this.aiTimer += delta;
    
        // Exemple : l'IA spawn une unité toutes les 2 secondes si elle a assez d'or
        if (this.aiTimer > 2) {
            // Choix aléatoire d'une troupe
            const troopTypes: UnitType[] = ['archer', 'knight'];
            const randomType = troopTypes[Math.floor(Math.random() * troopTypes.length)];
    
            // Essaie de spawn pour l'ennemi
            this.spawnUnit('enemy', randomType);
    
            this.aiTimer = 0;
        }
    }

    public spawnUnit(team: 'player' | 'enemy', unitType: UnitType): boolean
    {
        const side = team === 'player' ? this.state.player : this.state.enemy;
        const unitConfig = GAME_CONFIG.UNITS[unitType];

        if (side.gold < unitConfig.cost)
            return false;

        const newUnit: Unit = 
        {
            id: `${team}-${Date.now()} - ${Math.random()}`,
            type: unitType,
            y: GAME_CONFIG.GROUND,
            x: team === 'player' ? GAME_CONFIG.TOWER_POSITION.player : GAME_CONFIG.TOWER_POSITION.enemy,
            hp: unitConfig.hp,
            team: team,
            imgKey: unitConfig.imgKey,
            attackImgKey: unitConfig.attackImgKey,
            idleImgKey: unitConfig.idleImgKey,
            deadImgKey: unitConfig.deadImgKey,
            state: 'walking',
            attackTimer: 0,
            deathTimer: 0,
            targetId: null,
            isAttackingTower: false
        };

        side.gold -= unitConfig.cost;
        side.units.push(newUnit);
        return true;
    }

    public update(): void
    {
        const now = Date.now();
        const delta = (now - this.lastTick) / 1000;
        this.lastTick = now;

        if (this.state.player.tower <= 0)
        {
            this.state.finish = true;
            this.state.winner = this.state.enemy.username;
            return;
        }
        if (this.state.enemy.tower <= 0)
        {
            this.state.finish = true;
            this.state.winner = this.state.player.username;
            return;
        }


        this.state.player.gold += GAME_CONFIG.GOLD_PER_SECOND * delta;
        this.state.enemy.gold += GAME_CONFIG.GOLD_PER_SECOND * delta;

        this.updateUnits(delta);

        if (!this.isMultiplayer)
            this.updateAI(delta);
    }

    public updateUnits(delta: number): void 
    {
        // Parcourir chaque camp (joueur et ennemi)
        for (const side of ['player', 'enemy'] as const)
        {
            // Récupérer le tableau d'unités du camp actuel
            const units = this.state[side].units;
            
            // Tableau pour stocker les unités à supprimer
            const unitsToRemove: number[] = [];
            
            // Parcourir chaque unité du camp
            for (let i = 0; i < units.length; i++) {
                const unit = units[i];
                
                if (unit.hp <= 0 && unit.state !== 'dead')
                {
                    unit.state = 'dead';
                    unit.deathTimer = 0;
                    // Faire en sorte que toutes les unités qui ciblent cette unité perdent leur cible
                    const enemySide = side === 'player' ? 'enemy' : 'player';
                    this.state[enemySide].units.forEach(enemyUnit => {
                        if (enemyUnit.targetId === unit.id) {
                            enemyUnit.targetId = null;
                            enemyUnit.state = 'walking';
                        }
                    });
                    continue;
                }

                // Si l'unité est morte, gérer l'animation de mort
                if (unit.state === 'dead') {
                    unit.deathTimer += delta;
                    // Attendre 2.4 secondes (8 frames * 300ms) avant de supprimer l'unité
                    if (unit.deathTimer >= 2.4) {
                        unitsToRemove.push(i);
                    }
                    continue;
                }

                // Incrémenter le timer d'attaque avec le temps écoulé
                unit.attackTimer += delta;

                // Si l'unité n'a pas de cible actuellement
                if (!unit.targetId) {
                    const enemySide = side === 'player' ? 'enemy' : 'player';
                    const enemyUnits = this.state[enemySide].units;
                    const unitConfig = GAME_CONFIG.UNITS[unit.type];

                    let nearestEnemy: Unit | null = null;
                    let minDistance = Infinity;

                    // Ne cibler que les unités non mortes
                    for (const enemy of enemyUnits) {
                        if (enemy.state !== 'dead') {
                            const distance = Math.abs(enemy.x - unit.x);
                            if (distance <= unitConfig.range && distance < minDistance) {
                                nearestEnemy = enemy;
                                minDistance = distance;
                            }
                        }
                    }

                    // Vérifier si on peut attaquer la tour ennemie
                    const enemyTowerX = GAME_CONFIG.TOWER_POSITION[enemySide];
                    const distanceToTower = Math.abs(unit.x - enemyTowerX);

                    // Si aucun ennemi n'est trouvé et que la tour est à portée
                    if (!nearestEnemy && distanceToTower <= unitConfig.range) {
                        if (!unit.isAttackingTower) {
                            unit.isAttackingTower = true;
                            unit.state = 'attacking';
                            unit.attackTimer = 0;  // Réinitialiser le timer seulement quand on commence à attaquer la tour
                        }
                    } else if (nearestEnemy) {
                        unit.isAttackingTower = false;
                        unit.targetId = nearestEnemy.id;
                        unit.state = 'attacking';
                        unit.attackTimer = 0;
                    }
                }

                // Si l'unité est en mode attaque
                if (unit.state === 'attacking') {
                    const enemySide = side === 'player' ? 'enemy' : 'player';
                    const unitConfig = GAME_CONFIG.UNITS[unit.type];

                    // Si l'unité cible une autre unité
                    if (unit.targetId) {
                        const target = this.state[enemySide].units.find(enemy => enemy.id === unit.targetId);
                        if (target) {
                            const distance = Math.abs(target.x - unit.x);
                            if (distance <= unitConfig.range) {
                                if (unit.attackTimer >= 1 / unitConfig.attackSpeed) {
                                    target.hp -= unitConfig.damage;
                                    unit.attackTimer = 0;
                                }
                            } else {
                                unit.targetId = null;
                                unit.state = 'walking';
                            }
                        } else {
                            unit.targetId = null;
                            unit.state = 'walking';
                        }
                    } 
                    // Si l'unité attaque la tour
                    else if (unit.isAttackingTower)
                    {
                        const enemyTowerX = GAME_CONFIG.TOWER_POSITION[enemySide];
                        const distanceToTower = Math.abs(unit.x - enemyTowerX);

                        if (distanceToTower <= unitConfig.range) 
                        {
                            if (unit.attackTimer >= 1 / unitConfig.attackSpeed) {
                                this.state[enemySide].tower -= unitConfig.damage;
                                unit.attackTimer = 0;
                            }
                        } else {
                            unit.isAttackingTower = false;
                            unit.state = 'walking';
                        }
                    }
                }

                // Si pas de cible et en mode marche ou idle
                if (!unit.targetId && (unit.state === 'walking' || unit.state === 'idle')) {
                    // Déterminer la direction de mouvement
                    const direction = side === 'player' ? 1 : -1;
                    const unitConfig = GAME_CONFIG.UNITS[unit.type];

                    // Trouver l'unité la plus proche devant nous
                    let canMove = true;
                    const MIN_DISTANCE = 50; // Distance minimale entre les unités

                    for (const otherUnit of units) {
                        if (otherUnit !== unit) {
                            // Pour les unités du joueur, vérifier à droite
                            if (side === 'player' && otherUnit.x > unit.x) {
                                const distance = otherUnit.x - unit.x;
                                if (distance < MIN_DISTANCE && otherUnit.state !== 'dead') {
                                    canMove = false;
                                    break;
                                }
                            }
                            // Pour les unités ennemies, vérifier à gauche
                            else if (side === 'enemy' && otherUnit.x < unit.x) {
                                const distance = unit.x - otherUnit.x;
                                if (distance < MIN_DISTANCE && otherUnit.state !== 'dead') {
                                    canMove = false;
                                    break;
                                }
                            }
                        }
                    }

                    // Mettre à jour l'état selon si l'unité peut bouger ou non
                    if (canMove) {
                        unit.x += direction * unitConfig.speed * delta;
                        if (unit.state === 'idle') {
                            unit.state = 'walking';
                        }
                    } else if (unit.state === 'walking') {
                        unit.state = 'idle';
                    }
                }
            }

            // Supprimer les unités mortes (de la fin vers le début pour éviter les problèmes d'index)
            for (let i = unitsToRemove.length - 1; i >= 0; i--) {
                const indexToRemove = unitsToRemove[i];
                if (indexToRemove >= 0 && indexToRemove < units.length) {
                    units.splice(indexToRemove, 1);
                }
            }
        }
    }

    public getState(): GameState
    {
        return this.state;
    }

    public getSocketPlayerOne(): string {
        return this.socketPlayerOne;
    }

    public getSocketPlayerTwo(): string {
        return this.socketPlayerTwo;
    }
}