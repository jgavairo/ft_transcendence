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
            hp: 30,
            speed: 50,
            damage: 10,
            range: 150,
            cost: 15,
            imgKey: 'archer_walk',
            attackSpeed: 1,
            attackImgKey: 'archer_attack',
            idleImgKey: 'archer_idle',
            deadImgKey: 'archer_dead'
        },
        knight:
        {
            hp: 120,
            speed: 50,
            damage: 40,
            range: 40,
            cost: 50,
            imgKey: 'knight_walk',
            attackSpeed: 1,
            attackImgKey: 'knight_attack',
            idleImgKey: 'knight_idle',
            deadImgKey: 'knight_dead'
        },
        mage:
        {
            hp: 50,
            speed: 50,
            damage: 70,
            range: 120,
            cost: 60,
            imgKey: 'mage_walk',
            attackSpeed: 0.5,
            attackImgKey: 'mage_attack',
            idleImgKey: 'mage_idle',
            deadImgKey: 'mage_dead'
        },
        minotaur:
        {
            hp: 200,
            speed: 50,
            damage: 100,
            range: 50,
            cost: 120,
            imgKey: 'minotaur_walk',
            attackSpeed: 0.5,
            attackImgKey: 'minotaur_attack',
            idleImgKey: 'minotaur_idle',
            deadImgKey: 'minotaur_dead'
        },
        samourai:
        {
            hp: 100,
            speed: 50,
            damage: 60,
            range: 40,
            cost: 60,
            imgKey: 'samourai_walk',
            attackSpeed: 1,
            attackImgKey: 'samourai_attack',
            idleImgKey: 'samourai_idle',
            deadImgKey: 'samourai_dead'
        },
        samouraiArcher:
        {
            hp: 50,
            speed: 50,
            damage: 10,
            range: 350,
            cost: 50,
            imgKey: 'samouraiArcher_walk',
            attackSpeed: 0.5,
            attackImgKey: 'samouraiArcher_attack',
            idleImgKey: 'samouraiArcher_idle',
            deadImgKey: 'samouraiArcher_dead'
        },
    }
}