import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";
import { authMiddleware } from '../middleware/auth.js';

export interface AuthenticatedRequest extends FastifyRequest
{
    user: 
    {
        id: number;
    };
}

const getInfosHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const user = await dbManager.getUserById((request as AuthenticatedRequest).user.id);
        if (!user) 
        {
            return reply.status(404).send
            ({
                success: false,
                message: "User not found"
            });
        }

        return reply.send({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture,
                bio: user.bio || '',
                created_at: user.created_at,
                library: user.library || []
            }
        });
    } 
    catch (error) 
    {
        console.error("Erreur détaillée dans getInfosHandler:", error);
        return reply.status(500).send
        ({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const getUserLibraryHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const library = await dbManager.getUserLibrary((request as AuthenticatedRequest).user.id);
        return reply.send
        ({
            success: true,
            library: library
        });
    } 
    catch (error) 
    {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const addGameHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        await dbManager.addGameToLibrary((request as AuthenticatedRequest).user.id, (request.body as { gameId: number }).gameId);
        return reply.send
        ({
            success: true,
            message: "Jeu ajouté à la bibliothèque"
        });
    } 
    catch (error) 
    {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const getAllUsersHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        const users = await dbManager.getAllUsernamesWithIds();
        return reply.send
        ({
            success: true,
            users: users
        });
    } 
    catch (error) 
    {
        console.error('Error fetching usernames:', error);
        return reply.status(500).send({
            success: false,
            message: "Erreur lors de la récupération des utilisateurs"
        });
    }
}

export const userRoutes = 
{
    getInfos: getInfosHandler,
    getUserLibrary: getUserLibraryHandler,
    getAllUsers: getAllUsersHandler,
    addGame: addGameHandler,
};
