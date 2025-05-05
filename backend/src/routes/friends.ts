import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { AuthenticatedRequest } from "./user";
import { authMiddleware } from "../middleware/auth.js";
import { dbManager } from "../database/database.js";
import { generalNs } from "../server.js";

async function sendRequestHandler(request: FastifyRequest, reply: FastifyReply) 
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;
        const { username } = request.body as { username: string };

        if (!username)
        {
            return reply.status(400).send({
                success: false,
                message: "Username is required"
            });
        }
        const sender = await dbManager.getUserById(userId);
        const receiver = await dbManager.getUserByUsername(username);
        if (!sender)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found (sender)"
            });
        }
        if (!receiver)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found (receiver)"
            });
        }
        const receiverId = receiver.id;
        if (!receiverId)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found (receiverId)"
            });
        }
        console.log("111111111---------------");
        await dbManager.sendFriendRequest(userId, receiverId);
        console.log("222222222---------------");
        
        // Chercher tous les sockets connectés
        const allSockets = Array.from(generalNs.sockets.values());
        console.log('All connected sockets:', allSockets.map(s => s.id));
        
        // Afficher les rooms de chaque socket
        allSockets.forEach(socket => {
            const rooms = Array.from(socket.rooms);
            console.log(`Socket ${socket.id} is in rooms:`, rooms);
        });
        
        // Trouver le socket du destinataire
        const receiverSocket = Array.from(generalNs.sockets.values()).find(socket => {
            const rooms = Array.from(socket.rooms);
            console.log('Checking socket:', socket.id, 'with rooms:', rooms);
            return rooms.some(room => {
                console.log('Comparing room:', room, 'with receiverId:', receiverId);
                return room.toString() === receiverId.toString();
            });
        });
        
        if (receiverSocket) {
            console.log('Found receiver socket:', receiverSocket.id);
            // Émettre directement au socket du destinataire
            generalNs.to(receiverSocket.id).emit('sendRequest', { 
                senderId: userId,
                senderUsername: sender.username 
            });
        } else {
            console.log('Receiver socket not found for user ID:', receiverId);
        }
        
        console.log("333333333---------------");
        return reply.status(200).send({
            success: true,
            message: "Friend request sent"
        });
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from sendRequestHandler"
        });
    }
}

async function isFriendHandler(request: FastifyRequest, reply: FastifyReply)
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;
        const { username } = request.body as { username: string };

        if (!username)
        {
            return reply.status(400).send({
                success: false,
                message: "Username is required"
            });
        }

        const targetUser = await dbManager.getUserByUsername(username);
        if (!targetUser || !targetUser.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        const isFriend = await dbManager.isFriend(userId, targetUser.id);
        return reply.status(200).send
        ({
            success: true,
            isFriend: isFriend
        });
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from isFriendHandler"
        });
    }
}

async function isRequestingHandler(request: FastifyRequest, reply: FastifyReply)
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;
        const { username } = request.body as { username: string };

        if (!username)
        {
            return reply.status(400).send({
                success: false,
                message: "Username is required"
            });
        }

        const targetUser = await dbManager.getUserByUsername(username);
        if (!targetUser || !targetUser.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        const isRequesting = await dbManager.isRequesting(userId, targetUser.id);
        return reply.status(200).send
        ({
            success: true,
            isRequesting: isRequesting
        });
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from isRequestingHandler"
        });
    }
}

async function isRequestedHandler(request: FastifyRequest, reply: FastifyReply)
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;
        const { username } = request.body as { username: string };

        if (!username)
        {
            return reply.status(400).send({
                success: false,
                message: "Username is required"
            });
        }

        const targetUser = await dbManager.getUserByUsername(username);
        if (!targetUser || !targetUser.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        const isRequested = await dbManager.isRequested(userId, targetUser.id);
        return reply.status(200).send
        ({
            success: true,
            isRequested: isRequested
        });
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from isRequestedHandler"
        });
    }
}

async function acceptRequestHandler(request: FastifyRequest, reply: FastifyReply)
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;
        const { username } = request.body as { username: string };

        if (!username)
        {
            return reply.status(400).send({
                success: false,
                message: "Username is required"
            });
        }
        
        const targetUser = await dbManager.getUserByUsername(username);
        if (!targetUser || !targetUser.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        await dbManager.acceptFriendRequest(userId, targetUser.id);
        return reply.status(200).send
        ({
            success: true,
            message: "Friend request accepted"
        });
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from acceptRequestHandler"
        });
    }
}

export const friendsRoutes = 
{
    sendRequest : sendRequestHandler,
    isFriend : isFriendHandler,
    isRequesting : isRequestingHandler,
    isRequested : isRequestedHandler,
    acceptRequest : acceptRequestHandler
}