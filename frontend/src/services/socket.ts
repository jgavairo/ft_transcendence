import { io } from 'socket.io-client';

const getSocketUrl = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    return `http://${hostname}:${port}`;
};

export const socket = io(getSocketUrl(), {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling']
}); 