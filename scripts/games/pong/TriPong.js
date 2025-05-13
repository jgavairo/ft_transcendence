import { socket } from './network.js';
import { connectPong, startPong } from './pongGame.js';
import { sendMoveTri } from './SocketEmit.js';
/**
 * Lancement du Tri-Pong (à appeler sur le clic du bouton).
 */
export function initPong(username) {
    connectPong(); // branche matchFoundTri → startPong → renderPong
    startPong(); // configure canvas + clavier
    console.log('=> joinTriQueue', username);
export function initTriPong(username) {
    connectPong();
    startPong();
    socket.emit('joinTriQueue', { username });
}
