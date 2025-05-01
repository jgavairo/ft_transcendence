import { io } from 'socket.io-client';
// import { HOSTNAME } from '../main.js';
import { showNotification } from '../helpers/notifications.js';

const HOSTNAME = window.location.hostname;
export const socket = io(`http://${HOSTNAME}:3000/general`, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

socket.on('sendRequest', (data: { senderId: string}) =>
{
    showNotification(`${data.senderId} wants to be your friend`);
});