import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";

const getChatHistoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const messages = await dbManager.getLastMessages(50);

        // Récupérer les informations des utilisateurs pour chaque message
        const enrichedMessages = await Promise.all(
            messages.map(async (message) => {
                const user = await dbManager.getUserByUsername(message.author);
                return {
                    ...message,
                    profile_picture: user?.profile_picture || "default-profile.png",
                    username: user?.username || "Unknown User"
                };
            })
        );

        return reply.send({ success: true, messages: enrichedMessages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return reply.status(500).send({
            success: false,
            message: "Error fetching chat history"
        });
    }
};

export const chatRoutes = {
    getChatHistory: getChatHistoryHandler
};