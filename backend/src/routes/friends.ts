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
        await dbManager.sendFriendRequest(userId, receiverId);
        generalNs.to(receiverId.toString()).emit('sendRequest', { senderId: userId });

    
    }
    catch (error)
    {
        return reply.status(500).send({
            success: false,
            message: "Error from sendRequestHandler"
        });
    }
}
export const friendsRoutes = 
{
    sendRequest : sendRequestHandler
}