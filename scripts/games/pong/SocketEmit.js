import { socket } from "./network.js";
import { GameManager } from "../../managers/gameManager.js";
export async function joinQueue(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
        socket.emit('joinQueue', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // En cas d'erreur, envoyer seulement le nom d'utilisateur
        socket.emit('joinQueue', { username });
    }
}
export function joinTournament(nbPlayers, username) {
    socket.emit('joinTournament', { size: nbPlayers, username });
}
export async function startSoloPong(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
        socket.emit('startSolo', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // En cas d'erreur, envoyer seulement le nom d'utilisateur
        socket.emit('startSolo', { username });
    }
}
export async function startSoloPongVsBot(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
        socket.emit('startSoloVsBot', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // En cas d'erreur, envoyer seulement le nom d'utilisateur
        socket.emit('startSoloVsBot', { username });
    }
}
// Ajout d'une fonction pour le mode Tri-Pong
export async function joinTriQueue(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
        socket.emit('joinTriQueue', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // En cas d'erreur, envoyer seulement le nom d'utilisateur
        socket.emit('joinTriQueue', { username });
    }
}
export async function startSoloTri(username) {
    // Récupérer l'utilisateur actuel et son ID si disponible
    try {
        const currentUser = await GameManager.getCurrentUser();
        const userId = currentUser === null || currentUser === void 0 ? void 0 : currentUser.id;
        // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
        socket.emit('startSoloTri', { username, userId });
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        // En cas d'erreur, envoyer seulement le nom d'utilisateur
        socket.emit('startSoloTri', { username });
    }
}
// Envoi des commandes paddle au serveur
export function sendMove(side, direction) {
    socket.emit('movePaddle', { side, direction });
}
export function sendMoveTri(side, direction) {
    socket.emit('movePaddleTri', { side, direction });
}
