import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { AuthenticatedRequest } from "./user";
import { authMiddleware } from "../middleware/auth.js";
import { dbManager } from "../database/database.js";
import { app, userSocketMap } from "../server.js";




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

        const receiver = await dbManager.getUserByUsername(username);

        if (!receiver || !receiver.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found (receiver)"
            });
        }

        await dbManager.sendFriendRequest(userId, receiver.id);

        const socketId = userSocketMap.get(receiver.username);
        if (socketId)
        {
            app.io.of('/notification').to(socketId).emit('friendNotification', 
            {
                sender: userId,
                receiver: receiver.username,
                message: "You have a new friend request"
            });
        }
        else
        {
            console.error('No socketId found for receiver:', receiver.username);
        }

        return reply.status(200).send({
            success: true,
            message: "Friend request sent"
        });
    }
    catch (error)
    {
        console.error('Error in sendRequestHandler:', error);
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
        
        const sender = await dbManager.getUserById(userId);
        const targetUser = await dbManager.getUserByUsername(username);
        if (!targetUser || !targetUser.id || !sender || !sender.username)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        await dbManager.acceptFriendRequest(userId, targetUser.id);
        
        const socketId = userSocketMap.get(targetUser.username);
        if (socketId)
        {
            app.io.of('/notification').to(socketId).emit('friendNotification', 
            {
                sender: userId,
                receiver: targetUser.username,
                message: sender.username + " accepted your friend request",
            });
        }
        else
        {
            console.error('No socketId found for receiver:', targetUser.username);
        }
    
        return reply.status(200).send({
            success: true,
            message: "Friend request accepted"
        });
    }
    catch (error)
    {
        console.error('Error in acceptRequestHandler:', error);
        return reply.status(500).send({
            success: false,
            message: "Error from acceptRequestHandler"
        });
    }
}

async function removeFriendHandler(request: FastifyRequest, reply: FastifyReply)
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

        try 
        {
            await dbManager.removeFriend(userId, targetUser.id);

            const socketId = userSocketMap.get(targetUser.username);
            if (socketId)
            {
                app.io.of('/notification').to(socketId).emit('friendNotification', 
                {
                    sender: userId,
                    receiver: targetUser.username
                });
            }
            else
            {
                console.error('No socketId found for receiver:', targetUser.username);
            }

            return reply.status(200).send({
                success: true,
                message: "Friend removed"
            });
        } catch (error: any) {
            if (error.message === 'Users are not friends') {
                return reply.status(400).send({
                    success: false,
                    message: "Users are not friends"
                });
            }
            throw error;
        }
    }
    catch (error)
    {
        console.error('Error in removeFriendHandler:', error);
        return reply.status(500).send({
            success: false,
            message: "Error from removeFriendHandler"
        });
    }
}

async function cancelRequestHandler(request: FastifyRequest, reply: FastifyReply)
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
        if (isFriend)
        {
            return reply.status(400).send({
                success: false,
                message: "Users are friends"
            });
        }

        await dbManager.cancelFriendRequest(userId, targetUser.id);
        
        const socketId = userSocketMap.get(targetUser.username);
        if (socketId)
        {
            app.io.of('/notification').to(socketId).emit('friendNotification', 
            {
                sender: userId,
                receiver: targetUser.username
            });
        }
        else
        {
            console.error('No socketId found for receiver:', targetUser.username);
        }
        
        return reply.status(200).send({
            success: true,
            message: "Friend request cancelled"
        });
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from cancelRequestHandler"
        });
    }
}

async function refuseRequestHandler(request: FastifyRequest, reply: FastifyReply)
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
        if (!isRequested)
        {
            return reply.status(400).send({
                success: false,
                message: "Friend request is not valid"
            });
        }
        await dbManager.refuseFriendRequest(userId, targetUser.id);

        const socketId = userSocketMap.get(targetUser.username);
        if (socketId)
        {
            app.io.of('/notification').to(socketId).emit('friendNotification', 
            {
                sender: userId,
                receiver: targetUser.username
            });
        }
        else
        {
            console.error('No socketId found for receiver:', targetUser.username);
        }

        return reply.status(200).send({
            success: true,
            message: "Friend request refused"
        });
    }
    catch (error)
    {
        console.error('Error in refuseRequestHandler:', error);
        return reply.status(500).send({
            success: false,
            message: "Error from refuseRequestHandler"
        });
    }
}

async function isOnlineHandler(request: FastifyRequest, reply: FastifyReply)
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const { username } = request.body as { username: string };
        const isOnline = userSocketMap.has(username);
        return reply.status(200).send
        ({
            success: true,
            isOnline: isOnline
        });
    }
    catch (error)
    {
        console.error('Error in isOnlineHandler:', error);
        return reply.status(500).send({
            success: false,
            message: "Error from isOnlineHandler"
        });
    }
}

export const friendsRoutes = 
{
    sendRequest : sendRequestHandler,
    isFriend : isFriendHandler,
    isRequesting : isRequestingHandler,
    isRequested : isRequestedHandler,
    acceptRequest : acceptRequestHandler,
    removeFriend : removeFriendHandler,
    cancelRequest : cancelRequestHandler,
    refuseRequest : refuseRequestHandler,
    isOnline : isOnlineHandler
        
}