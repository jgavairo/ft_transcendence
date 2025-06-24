import { connectsSocket } from "./network.js";
import { GameManager } from "../../managers/gameManager.js";


export async function joinQueue(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    const socket = await connectsSocket();
    if (socket)
      socket.emit('joinQueue', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    const socket = await connectsSocket();
    if (socket)
      socket.emit('joinQueue', { username });
  }
}

export async function joinTournament(nbPlayers: number, username: string) {
  const socket = await connectsSocket();
  if (socket)
    socket.emit('joinTournament', { size: nbPlayers, username });
}


export async function startSoloPong(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    const socket = await connectsSocket();
    if (socket)
      socket.emit('startSolo', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    const socket = await connectsSocket();
    if (socket)
      socket.emit('startSolo', { username });
  }
}

export async function startSoloPongVsBot(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    const socket = await connectsSocket();
    if (socket)
      socket.emit('startSoloVsBot', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    const socket = await connectsSocket();
    if (socket)
      socket.emit('startSoloVsBot', { username });
  }
}

// Ajout d'une fonction pour le mode Tri-Pong
export async function joinTriQueue(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    const socket = await connectsSocket();
    if (socket)
      socket.emit('joinTriQueue', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    const socket = await connectsSocket();
    if (socket)
      socket.emit('joinTriQueue', { username });
  }
}

export async function startSoloTri(username: string) {
  // Récupérer l'utilisateur actuel et son ID si disponible
  try {
    const currentUser = await GameManager.getCurrentUser();
    const userId = currentUser?.id;
    const socket = await connectsSocket();
    if (socket)
      socket.emit('startSoloTri', { username, userId });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    const socket = await connectsSocket();
    if (socket)
      socket.emit('startSoloTri', { username });
  }
}

// Envoi des commandes paddle au serveur
export async function sendMove(side: number, direction: 'up' | 'down' | null) {
  const socket = await connectsSocket();
  if (socket)
    socket.emit('movePaddle', { side, direction });
}

export async function sendMoveTri(side: number, direction: 'up'|'down'|null) {
  const socket = await connectsSocket();
  if (socket)
    socket.emit('movePaddleTri', { side, direction });
}
