import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../server.js';
import { dbManager } from '../database/database.js';

export interface AuthenticatedRequest extends FastifyRequest 
{
    user?: any;
}

export const authMiddleware = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try 
    {
        const token = request.cookies.token;
        
        if (!token) 
        {
            return reply.status(401).send({
                success: false,
                message: "User is not authenified"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        
        const user = await dbManager.getUserById(decoded.userId);
        
        if (!user) {
            return reply.status(401).send({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        // Ajouter l'utilisateur à la requête pour une utilisation ultérieure
        request.user = user;
        
        return;
    } 
    catch (error) 
    {
        console.error("Authentication error:", error);
        return reply.status(401).send({
            success: false,
            message: "Token invalide"
        });
    }
}; 