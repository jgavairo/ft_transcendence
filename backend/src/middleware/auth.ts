import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../server.js';
import { dbManager } from '../database/database.js';

export interface AuthenticatedRequest extends FastifyRequest {
    user?: any;
}

export const authMiddleware = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
        const token = request.cookies.token;
        console.log("Auth middleware - Token:", token ? "Présent" : "Absent");
        
        if (!token) {
            console.log("Auth middleware - Token absent, renvoi 401");
            return reply.status(401).send({
                success: false,
                message: "Non authentifié"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        console.log("Auth middleware - Token décodé, userId:", decoded.userId);
        
        const user = await dbManager.getUserById(decoded.userId);
        console.log("Auth middleware - Utilisateur trouvé:", user ? "Oui" : "Non");
        
        if (!user) {
            console.log("Auth middleware - Utilisateur non trouvé, renvoi 401");
            return reply.status(401).send({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        // Ajouter l'utilisateur à la requête pour une utilisation ultérieure
        request.user = user;
        
        return;
    } catch (error) {
        console.error("Erreur d'authentification:", error);
        return reply.status(401).send({
            success: false,
            message: "Token invalide"
        });
    }
}; 