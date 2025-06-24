import { connectsSocket } from "./network.js";
import { GameManager } from "../../managers/gameManager.js";
export async function joinQueue(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        const socket = await connectsSocket();
        if (socket)
            socket.emit('joinQueue', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        const socket = await connectsSocket();
        if (socket)
            socket.emit('joinQueue', { username });
    }
}
export async function joinTournament(nbPlayers, username) {
    const socket = await connectsSocket();
    if (socket)
        socket.emit('joinTournament', { size: nbPlayers, username });
}
export async function startSoloPong(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        const socket = await connectsSocket();
        if (socket)
            socket.emit('startSolo', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        const socket = await connectsSocket();
        if (socket)
            socket.emit('startSolo', { username });
    }
}
export async function startSoloPongVsBot(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        const socket = await connectsSocket();
        if (socket)
            socket.emit('startSoloVsBot', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        const socket = await connectsSocket();
        if (socket)
            socket.emit('startSoloVsBot', { username });
    }
}
// Ajout d'une fonction pour le mode Tri-Pong
export async function joinTriQueue(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        const socket = await connectsSocket();
        if (socket)
            socket.emit('joinTriQueue', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        const socket = await connectsSocket();
        if (socket)
            socket.emit('joinTriQueue', { username });
    }
}
export async function startSoloTri(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        const socket = await connectsSocket();
        if (socket)
            socket.emit('startSoloTri', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        const socket = await connectsSocket();
        if (socket)
            socket.emit('startSoloTri', { username });
    }
}
// Envoi des commandes paddle au serveur
export async function sendMove(side, direction) {
    const socket = await connectsSocket();
    if (socket)
        socket.emit('movePaddle', { side, direction });
}
export async function sendMoveTri(side, direction) {
    const socket = await connectsSocket();
    if (socket)
        socket.emit('movePaddleTri', { side, direction });
}
