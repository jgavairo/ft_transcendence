export type UnitType = 'archer' | 'knight'

export interface Unit
{
    id: string;
    type: UnitType;
    x: number;
    y: number;
    hp: number,
    team: 'player' | 'enemy';
    imgKey: string;
    attackImgKey: string;
    idleImgKey: string;
    deadImgKey: string;
    state: 'walking' | 'attacking' | 'idle' | 'dead';  // État actuel de l'unité
    attackTimer: number;             // Temps écoulé depuis la dernière attaque
    deathTimer: number;             // Timer pour l'animation de mort
    targetId: string | null;         // ID de la cible (unité ou tour)
    isAttackingTower: boolean;       // Indique si l'unité est en train d'attaquer la tour
}

export interface PlayerState
{
    username: string;
    gold: number;
    tower: number;
    units: Unit[];
}

export interface GameState
{
    player: PlayerState;
    enemy: PlayerState;
    finish: boolean;
    winner: string;
}

export interface spawnCommand
{
    type: 'spawn';
    troopType: UnitType;
}

