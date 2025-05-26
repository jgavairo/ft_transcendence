export const GAME_CONFIG = {
    
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    
    TICK_RATE: 60,
    
    GOLD_PER_SECOND: 2,
    
    TOWER_HP: 500,
    
    GROUND: 486,

    TOWER_POSITION: 
    {
        player: 90,
        enemy: 1100,
    },


    UNITS:
    {
        archer:
        {
            hp: 50,
            speed: 50,
            damage: 15,
            range: 150,
            cost: 40,
            imgKey: 'archer_walk',
            attackSpeed: 1,
            attackImgKey: 'archer_attack',
            idleImgKey: 'archer_idle',
            deadImgKey: 'archer_dead'
        },
        knight:
        {
            hp: 100,
            speed: 50,
            damage: 20,
            range: 50,
            cost: 50,
            imgKey: 'knight_walk',
            attackSpeed: 1,
            attackImgKey: 'knight_attack',
            idleImgKey: 'knight_idle',
            deadImgKey: 'knight_dead'
        }
    }
}