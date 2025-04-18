export interface MatchState {
  roomId: string;
  leftPaddleY: number;
  rightPaddleY: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
  leftScore: number;
  rightScore: number;
  leftLives: number;
  rightLives: number;
  leftPaddleDirection: "up" | "down" | null;
  rightPaddleDirection: "up" | "down" | null;
  gameOver?: boolean;
}

const TICK_RATE = 120; // FPS
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const BALL_RADIUS = 10;
const INITIAL_BALL_SPEED_X = 4;
const INITIAL_BALL_SPEED_Y = 2;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 4;
const INITIAL_LIVES = 5;

/**
 * Démarre le match entre deux joueurs et lance la boucle de simulation.
 * Retourne l'état initial du match pour pouvoir le stocker.
 */

export function startMatch(
  player1: { id: string; username: string },
  player2: { id: string; username: string },
  io: any
): MatchState {
  // Créer une room unique
  const roomId = `${player1.id}_${player2.id}`;
  io.sockets.sockets.get(player1.id)?.join(roomId);
  io.sockets.sockets.get(player2.id)?.join(roomId);

  // Initialiser l'état du match
  const matchState: MatchState = {
    roomId,
    leftPaddleY: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
    rightPaddleY: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: INITIAL_BALL_SPEED_X,
    ballSpeedY: INITIAL_BALL_SPEED_Y,
    leftScore: 0,
    rightScore: 0,
    leftLives: INITIAL_LIVES,
    rightLives: INITIAL_LIVES,
    leftPaddleDirection: null,
    rightPaddleDirection: null,
  };

  // Lancer la boucle de jeu côté serveur
  const intervalId = setInterval(() => {
    if (matchState.gameOver) {
      clearInterval(intervalId);
      io.to(roomId).emit('gameOver', {
        winner: (matchState.leftLives <= 0 ? player2.username : player1.username)
      });
      return;
    }
    updateGameState(matchState);
    io.to(roomId).volatile.emit('gameState', matchState)
  }, 1000 / TICK_RATE);

  return matchState;
}

/**
 * Met à jour l'état du match.
 */
function updateGameState(matchState: MatchState): void {
  // Mise à jour des positions des paddles (basée sur la direction reçue)
  if (matchState.leftPaddleDirection === "up") {
    matchState.leftPaddleY = Math.max(0, matchState.leftPaddleY - PADDLE_SPEED);
  } else if (matchState.leftPaddleDirection === "down") {
    matchState.leftPaddleY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, matchState.leftPaddleY + PADDLE_SPEED);
  }
  
  if (matchState.rightPaddleDirection === "up") {
    matchState.rightPaddleY = Math.max(0, matchState.rightPaddleY - PADDLE_SPEED);
  } else if (matchState.rightPaddleDirection === "down") {
    matchState.rightPaddleY = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, matchState.rightPaddleY + PADDLE_SPEED);
  }
  
  // Mise à jour de la position de la balle
  matchState.ballX += matchState.ballSpeedX;
  matchState.ballY += matchState.ballSpeedY;
  
  // Collision avec le haut et le bas
  if (matchState.ballY - BALL_RADIUS <= 0 || matchState.ballY + BALL_RADIUS >= CANVAS_HEIGHT) {
    matchState.ballSpeedY = -matchState.ballSpeedY;
  }
  
  if ( matchState.ballX - BALL_RADIUS <= 30 + PADDLE_WIDTH &&
    matchState.ballY >= matchState.leftPaddleY &&
    matchState.ballY <= matchState.leftPaddleY + PADDLE_HEIGHT
  ) {
    matchState.ballSpeedX = -matchState.ballSpeedX * 1.1;
  }

  if (
    matchState.ballX + BALL_RADIUS >= CANVAS_WIDTH - 50 - PADDLE_WIDTH &&
    matchState.ballY >= matchState.rightPaddleY &&
    matchState.ballY <= matchState.rightPaddleY + PADDLE_HEIGHT
  ) {
    matchState.ballSpeedX = -matchState.ballSpeedX * 1.1;
  }
  
  // Score et réinitialisation de la balle
  if (matchState.ballX - BALL_RADIUS <= 0) {
    matchState.leftLives--;
    resetBall(matchState, 1);
  } else if (matchState.ballX + BALL_RADIUS >= CANVAS_WIDTH) {
    matchState.rightLives--;
    resetBall(matchState, -1);
  }
  
  // Vérification de la fin du match
  if (matchState.leftLives <= 0 || matchState.rightLives <= 0) {
    matchState.gameOver = true;
  }
}

function resetBall(matchState: MatchState, direction: number): void {
  matchState.ballX = CANVAS_WIDTH / 2;
  matchState.ballY = CANVAS_HEIGHT / 2;
  matchState.ballSpeedX = INITIAL_BALL_SPEED_X * direction;
  matchState.ballSpeedY = INITIAL_BALL_SPEED_Y;
}
