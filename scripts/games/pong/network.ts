import { io, type Socket } from 'socket.io-client';
import { setupGlobalSocketErrorHandler } from './pongGame.js';

let socket: Socket | null = null;

export async function connectsSocket() {

  if (!socket) {
    socket = io(`https://${window.location.hostname}:8443/game`, {
      withCredentials: true
    });
  }
  if (socket) {
    setupGlobalSocketErrorHandler(socket);
  }
  return socket;
}
