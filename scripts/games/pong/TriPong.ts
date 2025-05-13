import { socket } from './network.js';
import { connectPong, startPong } from './pongGame.js';
import { sendMoveTri } from './SocketEmit.js';


export function initPong(username: string) {
  connectPong();
  startPong();
  socket.emit('joinTriQueue', { username });
}
