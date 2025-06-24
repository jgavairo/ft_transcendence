import { io } from 'socket.io-client';
import { setupGlobalSocketErrorHandler } from './pongGame.js';
let socket = null;
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
