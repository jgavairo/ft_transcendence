import { Socket } from 'socket.io';
import { generalNs } from '../server.js';

export function setupGeneralSocket()
{
    generalNs.on('connection', (socket: Socket) => 
    {
        console.log('New connection at general socket from', socket.id);

        socket.onAny((event, ...args) => {
            console.log(`Received event ${event} with args:`, args);
        });

        socket.on('authenticate', (data: { userId: string }) => 
        {
            console.log('Received authenticate event from socket:', socket.id);
            console.log('Authentication data:', data);
            console.log('User authenticated', data.userId);
            
            // Vérifier si le socket est déjà dans une room
            const currentRooms = Array.from(socket.rooms);
            console.log('Current rooms before join:', currentRooms);
            
            // Rejoindre la room avec le namespace
            generalNs.sockets.get(socket.id)?.join(data.userId);
            console.log('User joined room:', data.userId);
            
            // Vérifier que le socket est bien dans la room
            const rooms = generalNs.sockets.get(socket.id)?.rooms;
            console.log('User rooms after join:', rooms);
            
            // Vérifier si la room existe dans l'adapter
            const roomExists = generalNs.adapter.rooms.has(data.userId);
            console.log('Room exists in adapter:', roomExists);
        });
    });

    generalNs.on('disconnect', (socket) =>
    {
        console.log('User disconnected', socket.id);
    });
}