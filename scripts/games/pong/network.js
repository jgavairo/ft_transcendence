import { io } from 'socket.io-client';
export const socket = io(`https://${window.location.hostname}:8443/game`, {
    withCredentials: true
});
