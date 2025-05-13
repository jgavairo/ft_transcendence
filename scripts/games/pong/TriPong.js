import { socket } from './network.js';
import { connectPong, startPong } from './pongGame.js';
export function initPong(username) {
    connectPong();
    startPong();
    socket.emit('joinTriQueue', { username });
}
