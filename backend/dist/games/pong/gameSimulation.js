"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMatch = startMatch;
function startMatch(player1, player2, io) {
    var _a, _b;
    // Création de la room en combinant les ids
    const roomId = `${player1.id}_${player2.id}`;
    // Faire rejoindre la room aux deux joueurs
    (_a = io.sockets.sockets.get(player1.id)) === null || _a === void 0 ? void 0 : _a.join(roomId);
    (_b = io.sockets.sockets.get(player2.id)) === null || _b === void 0 ? void 0 : _b.join(roomId);
    // Initialiser l'état du match
    const matchState = {
        roomId,
        leftPaddleY: 100,
        rightPaddleY: 100,
        ballX: 300,
        ballY: 200,
        ballSpeedX: 6,
        ballSpeedY: 3,
        leftScore: 0,
        rightScore: 0
    };
    const TICK_RATE = 30; // Mises à jour par seconde
    const intervalId = setInterval(() => {
        updateGameState(matchState);
        io.to(roomId).emit('gameState', matchState);
        // Optionnel : arrêter l'interval si le match est terminé
    }, 1000 / TICK_RATE);
}
function updateGameState(matchState) {
    // Exemple de mise à jour de la balle (ajoute ici les collisions, etc.)
    matchState.ballX += matchState.ballSpeedX;
    matchState.ballY += matchState.ballSpeedY;
    // Gestion des collisions sur les murs (exemple, suppose une hauteur de canvas de 600)
    if (matchState.ballY <= 0 || matchState.ballY >= 600) {
        matchState.ballSpeedY = -matchState.ballSpeedY;
    }
    // Ajoute ici les autres logiques de mise à jour (collisions avec les paddles, scores, etc.)
}
