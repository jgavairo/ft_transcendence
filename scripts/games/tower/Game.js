export class Game {
    constructor(socket, username, side, opponent, menu) {
        this.isGameOver = false;
        this.socket = socket;
        this.username = username;
        this.side = side;
        this.opponent = opponent;
        this.menu = menu;
    }
    start() {
        if (this.opponent) {
            // Mode multijoueur
            console.log(`Starting multiplayer game as ${this.side} against ${this.opponent}`);
            this.socket.emit('ready');
        }
        else {
            // Mode solo
            console.log('Starting solo game');
            this.socket.emit('playSolo', this.username);
        }
    }
    handleOpponentLeft() {
        if (!this.isGameOver) {
            this.isGameOver = true;
            this.menu.changeMenu('endMatch', this.username);
        }
    }
    getSide() {
        return this.side;
    }
    getOpponent() {
        return this.opponent;
    }
}
