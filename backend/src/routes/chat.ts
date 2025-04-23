import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";

const getChatHistoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try 
    {
        const messages = await dbManager.getLastMessages(10);
        return reply.send({ success: true, messages });
    } 
    catch (error) 
    {
        console.error("Error fetching chat history:", error);
        return reply.status(500).send({
            success: false,
            message: "Error fetching chat history"
        });
    }
}

export const chatRoutes = {
    getChatHistory: getChatHistoryHandler
};