import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";
import { authMiddleware } from "../middleware/auth.js";
import { AuthenticatedRequest } from "./user";

const getChatHistoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        // Vérification authentification
        await authMiddleware(request as AuthenticatedRequest, reply);
        const authenticatedUserId = (request as AuthenticatedRequest).user.id;
        // On récupère l'id utilisateur depuis la query (author est maintenant un number)
        const userId = Number((request.query as any).userId);
        if (userId !== authenticatedUserId) {
            return reply.status(403).send({
                success: false,
                message: "Forbidden: userId does not match authenticated user."
            });
        }
        const messages = await dbManager.getLastMessages(50);

        // Récupérer le username de l'utilisateur courant
        const user = await dbManager.getUserById(userId);
        const username = user?.username;
        const filteredMessages = messages.filter(msg => {
            const mentionMatch = msg.content.match(/^@(\w+)/);
            if (!mentionMatch) return true; // message public
            // Afficher si la mention correspond à l'utilisateur courant ou si c'est un message envoyé par lui-même
            return (mentionMatch[1] === username) || (msg.author === userId);
        });

        // Enrichir les messages avec infos utilisateur (id → username/avatar)
        const enrichedMessages = await Promise.all(
            filteredMessages.map(async (message) => {
                const user = await dbManager.getUserById(message.author);
                return {
                    ...message,
                    profile_picture: user?.profile_picture || "default-profile.png",
                    username: user?.username || `User#${message.author}`
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