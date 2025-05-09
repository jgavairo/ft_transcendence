import { socket } from './network.js';
import { connectPong, startPong } from './pongGame.js';
import { sendMoveTri } from './SocketEmit.js';

/**
 * Lancement du Tri-Pong (à appeler sur le clic du bouton).
 */
export function initTriPong(username: string) {
  connectPong();          // branche matchFoundTri → startPong → renderPong
  startPong();            // configure canvas + clavier
  console.log('=> joinTriQueue', username);
  socket.emit('joinTriQueue', { username });
}

// Configuration des touches pour 3 paddles
const codes = ['KeyA','KeyD','KeyJ','KeyL','ArrowLeft','ArrowRight'];
window.addEventListener('keydown', e => {
  if (!codes.includes(e.code)) return;
  let side = ['KeyA','KeyD'].includes(e.code) ? 0
           : ['KeyJ','KeyL'].includes(e.code) ? 1
           : 2;
  const dir = ['KeyD','KeyL','ArrowRight'].includes(e.code) ? 'up' : 'down';
  sendMoveTri(side, dir);
});
window.addEventListener('keyup', e => {
  if (!codes.includes(e.code)) return;
  let side = ['KeyA','KeyD'].includes(e.code) ? 0
           : ['KeyJ','KeyL'].includes(e.code) ? 1
           : 2;
  sendMoveTri(side, null);
});