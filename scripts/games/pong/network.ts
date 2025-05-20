import { io, type Socket } from 'socket.io-client';

export const socket: Socket = io(`https://${window.location.hostname}:8443/game`, {
  withCredentials: true
});
