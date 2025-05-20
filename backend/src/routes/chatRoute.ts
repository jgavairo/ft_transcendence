import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";

const getChatHistoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const username = (request.query as any).username as string;
        const messages = await dbManager.getLastMessages(50);

        // Filtrer les messages publics ou mentionnant l'utilisateur
        const filteredMessages = messages.filter(msg => {
            const mentionMatch = msg.content.match(/^@(\w+)/);
            // Message public (pas de mention)
            if (!mentionMatch) return true;
            // Message privé pour cet utilisateur ou envoyé par lui-même
            return mentionMatch[1] === username || msg.author === username;
        });

        // Enrichir les messages comme avant
        const enrichedMessages = await Promise.all(
            filteredMessages.map(async (message) => {
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