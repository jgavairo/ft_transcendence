import { io } from 'socket.io-client';
// import { HOSTNAME } from '../main.js';
import { showNotification } from '../helpers/notifications.js';
import { UserLibraryManager } from '../managers/userLibrary.js';
import { renderPeopleList } from '../pages/community/peopleList.js';
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
    // Authentifier le socket avec l'ID utilisateur
    const userId = UserLibraryManager.getUser().id;
    if (userId) {
        console.log('Authenticating socket with userId:', userId);
        socket.emit('authenticate', { userId });
    }
});
socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});
socket.on('disconnect', (reason) => {
    console.log('Socket disconnected from general namespace. Reason:', reason);
});
// Vérifiez que l'événement est bien enregistré
console.log('Setting up sendRequest listener');
socket.on('sendRequest', (data) => {
    console.log('Received sendRequest event with data:', data);
    console.log('Current socket ID:', socket.id);
    console.log('Current socket connected:', socket.connected);
    if (data.senderUsername)
        showNotification(`${data.senderUsername} wants to be your friend`);
    else
        showNotification(`Un utilisateur (ID: ${data.senderId}) wants to be your friend`);
    renderPeopleList();
});
socket.on('acceptRequest', (data) => {
    console.log('Received acceptRequest event with data:', data);
    console.log('Current socket ID:', socket.id);
    console.log('Current socket connected:', socket.connected);
    if (data.senderUsername)
        showNotification(`${data.senderUsername} accepted your request`);
    else
        showNotification(` (ID: ${data.senderId}) accepted your request`);
    renderPeopleList();
});
socket.on('refuseRequest', (data) => {
    console.log('Received refuseRequest event with data:', data);
    console.log('Current socket ID:', socket.id);
    console.log('Current socket connected:', socket.connected);
    if (data.senderUsername)
        showNotification(`${data.senderUsername} refused your request`);
    else
        showNotification(`Un utilisateur (ID: ${data.senderId}) refused your request`);
    renderPeopleList();
});
