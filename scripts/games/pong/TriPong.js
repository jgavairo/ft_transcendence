import { socket } from './network.js';
import { connectPong, startPong } from './pongGame.js';
export function initTriPong(username) {
    connectPong();
    startPong();
    socket.emit('joinTriQueue', { username });
}
