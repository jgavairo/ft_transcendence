import io from 'socket.io-client';
console.log("Début de l'exécution du fichier pongGame.ts");
const socket = io('http://127.0.0.1:3000');
// Lorsque le serveur détecte un match (startMatch a été lancé)
socket.on("matchFound", (data) => {
    console.log("Match found!", data);
    // On peut laisser l'écran d'attente afficher un message, ou
    // le remplacer par une transition vers le mode jeu
});
// Le client écoute ensuite les mises à jour de jeu envoyées par le serveur
socket.on("gameState", (matchState) => {
    // Appelle une fonction de rendu pour mettre à jour l'affichage du jeu
    renderGame(matchState);
});
let selectedPaddleColor = 'white';
function renderGame(matchState) {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dessin de la balle
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(matchState.ballX, matchState.ballY, 10, 0, Math.PI * 2);
    ctx.fill();
    // Dessin des paddles
    const paddleWidth = 10;
    const paddleHeight = 100;
    ctx.fillStyle = selectedPaddleColor;
    ctx.fillRect(30, matchState.leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - 30 - paddleWidth, matchState.rightPaddleY, paddleWidth, paddleHeight);
    // Affichage des scores (optionnel)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${matchState.leftScore} - ${matchState.rightScore}`, canvas.width / 2, 40);
}
function displayWaitingScreen() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Waiting for opponent...', canvas.width / 2, canvas.height / 2);
}
export function displayMenu() {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const buttonWidth = 150;
    const buttonHeight = 50;
    const playButtonY = canvas.height / 2 - 100;
    const shopButtonY = canvas.height / 2;
    const centerX = (canvas.width - buttonWidth) / 2;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX, playButtonY, buttonWidth, buttonHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Play', centerX + buttonWidth / 2, playButtonY + buttonHeight / 2);
    ctx.strokeRect(centerX, shopButtonY, buttonWidth, buttonHeight);
    ctx.fillText('Shop', centerX + buttonWidth / 2, shopButtonY + buttonHeight / 2);
    const onClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        if (mouseX >= centerX &&
            mouseX <= centerX + buttonWidth &&
            mouseY >= playButtonY &&
            mouseY <= playButtonY + buttonHeight) {
            canvas.removeEventListener('click', onClick);
            // Envoie l'événement "joinQueue" et affiche l'écran d'attente
            socket.emit("joinQueue", { playerId: socket.id, username: "Player1" });
            displayWaitingScreen();
            return;
        }
        if (mouseX >= centerX &&
            mouseX <= centerX + buttonWidth &&
            mouseY >= shopButtonY &&
            mouseY <= shopButtonY + buttonHeight) {
            canvas.removeEventListener('click', onClick);
            displayShopMenu();
            return;
        }
    };
    canvas.addEventListener('click', onClick);
}
export function displayShopMenu() {
    // Ton code existant pour afficher le menu "Shop"
}
document.addEventListener('DOMContentLoaded', () => {
    displayMenu();
});
