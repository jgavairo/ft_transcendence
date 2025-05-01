import { Socket } from 'socket.io';
import { generalNs } from '../server.js';

export function setupGeneralSocket()
{
    generalNs.on('connection', (socket: Socket) => 
    {
        console.log('New connection at general socket from', socket.id);

        socket.on('authenticate', (data: { userId: string }) => 
        {
            socket.join(data.userId);
        });
    });

    generalNs.on('disconnect', (socket: Socket) =>
    {
        console.log('User disconnected', socket.id);
    });
}