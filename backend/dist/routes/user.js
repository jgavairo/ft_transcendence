import { dbManager } from "../database/database.js";
import { authMiddleware } from '../middleware/auth.js';
const getInfosHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        const user = await dbManager.getUserById(request.user.id);
        if (!user) {
            return reply.status(404).send({
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
    catch (error) {
        console.error("Erreur détaillée dans getInfosHandler:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const getUserLibraryHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        const library = await dbManager.getUserLibrary(request.user.id);
        return reply.send({
            success: true,
            library: library
        });
    }
    catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const addGameHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        await dbManager.addGameToLibrary(request.user.id, request.body.gameId);
        return reply.send({
            success: true,
            message: "Jeu ajouté à la bibliothèque"
        });
    }
    catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const getAllUsersHandler = async (request, reply) => {
    try {
        const users = await dbManager.getAllUsernamesWithIds();
        return reply.send({
            success: true,
            users: users
        });
    }
    catch (error) {
        console.error('Error fetching usernames:', error);
        return reply.status(500).send({
            success: false,
            message: "Erreur lors de la récupération des utilisateurs"
        });
    }
};
export const userRoutes = {
    getInfos: getInfosHandler,
    getUserLibrary: getUserLibraryHandler,
    getAllUsers: getAllUsersHandler,
    addGame: addGameHandler,
};
