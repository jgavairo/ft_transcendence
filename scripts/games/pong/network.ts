import { io, type Socket } from 'socket.io-client';

export const socket: Socket = io(`http://${window.location.hostname}:3000/game`, {
  withCredentials: true
});
