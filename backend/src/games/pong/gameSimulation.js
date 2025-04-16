// backend/src/games/pong/gameSimulation.ts
const TICK_RATE = 30; // 30 mises à jour par seconde
const CANVAS_WIDTH = 600; // Exemple : largeur du canvas
const CANVAS_HEIGHT = 600; // Exemple : hauteur du canvas
const BALL_RADIUS = 10; // Rayon de la balle
const INITIAL_BALL_SPEED_X = 6;
const INITIAL_BALL_SPEED_Y = 3;
const PADDLE_WIDTH = 10; // Pour collision avec les paddles (à implémenter ultérieurement)
const PADDLE_HEIGHT = 100; // Hauteur des paddles
export function startMatch(player1, player2, io) {
    var _a, _b;
    // Créer une room unique pour ce match
    const roomId = `${player1.id}_${player2.id}`;
    // Faire rejoindre la room aux joueurs
    (_a = io.sockets.sockets.get(player1.id)) === null || _a === void 0 ? void 0 : _a.join(roomId);
    (_b = io.sockets.sockets.get(player2.id)) === null || _b === void 0 ? void 0 : _b.join(roomId);
    // Initialiser l'état du match
    const matchState = {
        roomId,
        // Pour les paddles, on les centre verticalement
        leftPaddleY: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
        rightPaddleY: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
        // La balle démarre au centre
        ballX: CANVAS_WIDTH / 2,
        ballY: CANVAS_HEIGHT / 2,
        ballSpeedX: INITIAL_BALL_SPEED_X,
        ballSpeedY: INITIAL_BALL_SPEED_Y,
        leftScore: 0,
        rightScore: 0
    };
    // Lancer la boucle de jeu côté serveur
    setInterval(() => {
        updateGameState(matchState);
        // Diffuser l'état mis à jour dans la room
        io.to(roomId).emit('gameState', matchState);
    }, 1000 / TICK_RATE);
}
function updateGameState(matchState) {
    // Mettre à jour la position de la balle
    matchState.ballX += matchState.ballSpeedX;
    matchState.ballY += matchState.ballSpeedY;
    // Collision avec le haut et le bas du canvas
    if (matchState.ballY - BALL_RADIUS <= 0 || matchState.ballY + BALL_RADIUS >= CANVAS_HEIGHT) {
        matchState.ballSpeedY = -matchState.ballSpeedY;
    }
    // Si la balle sort à gauche : score pour le joueur droit
    if (matchState.ballX - BALL_RADIUS <= 0) {
        matchState.rightScore += 1;
        resetBall(matchState, 1); // La balle reprend avec une direction positive
    }
    // Si la balle sort à droite : score pour le joueur gauche
    else if (matchState.ballX + BALL_RADIUS >= CANVAS_WIDTH) {
        matchState.leftScore += 1;
        resetBall(matchState, -1); // La balle reprend avec une direction négative
    }
    // Ici, vous pouvez ajouter la détection des collisions avec les paddles
    // (par exemple, si la balle touche le paddle gauche ou droit, inverser la direction)
}
/**
 * Réinitialise la position et la vitesse de la balle au centre du canvas,
 * en donnant une direction à la balle en fonction du paramètre fourni.
 *
 * @param matchState L'état actuel du match.
 * @param direction Un nombre (+1 ou -1) indiquant la direction horizontale initiale.
 */
function resetBall(matchState, direction) {
    matchState.ballX = CANVAS_WIDTH / 2;
    matchState.ballY = CANVAS_HEIGHT / 2;
    matchState.ballSpeedX = INITIAL_BALL_SPEED_X * direction;
    matchState.ballSpeedY = INITIAL_BALL_SPEED_Y;
}
