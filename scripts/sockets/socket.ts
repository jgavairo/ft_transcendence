import { io } from 'socket.io-client';
// import { HOSTNAME } from '../main.js';
import { showNotification } from '../helpers/notifications.js';

const HOSTNAME = window.location.hostname;
export const socket = io(`http://${HOSTNAME}:3000/general`, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: false
});

// Fonction pour connecter le socket manuellement
export const connectSocket = () => {
    console.log('Attempting to connect socket...');
    socket.connect();
};

// Logs détaillés de connexion
socket.on('connect', () => {
    console.log('Socket connected to general namespace');
    console.log('Socket ID:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected from general namespace. Reason:', reason);
});

// Vérifiez que l'événement est bien enregistré
console.log('Setting up sendRequest listener');
socket.on('sendRequest', (data: { senderId: number, senderUsername: string }) => {
    console.log('Received sendRequest event with data:', data);
    console.log('Current socket ID:', socket.id);
    console.log('Current socket connected:', socket.connected);
    if (data.senderUsername) {
        showNotification(`${data.senderUsername} veut être votre ami`);
    } else {
        showNotification(`Un utilisateur (ID: ${data.senderId}) veut être votre ami`);
    }
});