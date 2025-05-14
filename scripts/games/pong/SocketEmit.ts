import { socket } from "./network.js";
import { GameManager } from "../../managers/gameManager.js";


export async function joinQueue(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    
    // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
    socket.emit('joinQueue', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    // En cas d'erreur, envoyer seulement le nom d'utilisateur
    socket.emit('joinQueue', { username });
  }
}

export async function startSoloPong(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    
    // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
    console.log("startSoloPong");
    socket.emit('startSolo', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    // En cas d'erreur, envoyer seulement le nom d'utilisateur
    socket.emit('startSolo', { username });
  }
}

// Ajout d'une fonction pour le mode Tri-Pong
export async function joinTriQueue(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    
    // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
    socket.emit('joinTriQueue', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    // En cas d'erreur, envoyer seulement le nom d'utilisateur
    socket.emit('joinTriQueue', { username });
  }
}

export async function startSoloTri(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    
    // Envoyer à la fois le nom d'utilisateur et l'ID utilisateur
    socket.emit('startSoloTri', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    // En cas d'erreur, envoyer seulement le nom d'utilisateur
    socket.emit('startSoloTri', { username });
  }
}

// Envoi des commandes paddle au serveur
export function sendMove(side: number, direction: 'up' | 'down' | null) {
  socket.emit('movePaddle', { side, direction });
}

export function sendMoveTri(side: number, direction: 'up'|'down'|null) {
    socket.emit('movePaddleTri', { side, direction });
  }
  