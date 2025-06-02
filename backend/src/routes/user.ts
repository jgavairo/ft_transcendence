import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";
import { authMiddleware } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

export interface AuthenticatedRequest extends FastifyRequest
{
    user: 
    {
        id: number;
    };
}

export interface ChangePasswordRequest 
{
    oldPassword: string;
    newPassword: string;
}

const getInfosHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const user = await dbManager.getUserById((request as AuthenticatedRequest).user.id);
        if (!user || !user.id)
        {
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

const changePasswordHandler = async (request: FastifyRequest<{ Body: ChangePasswordRequest }>, reply: FastifyReply) => 
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const user = await dbManager.getUserById((request as AuthenticatedRequest).user.id);
        if (!user || !user.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }
        const realPasswordHash = await dbManager.getUserPassword(user.id);
        const isValid = await bcrypt.compare(request.body.oldPassword, realPasswordHash);
        if (!isValid)
        {
            return reply.status(401).send({
                success: false,
                message: "Invalid password"
            });
        }
        const newHash = await bcrypt.hash(request.body.newPassword, 10);
        await dbManager.updateUserPassword(user.id, newHash);
        return reply.send
        ({
            success: true,
            message: "Password updated successfully"
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

const blockUserHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const { username } = request.body as { username: string };
        if (!username) return reply.status(400).send({ success: false, message: "Username required" });
        await dbManager.blockUser((request as AuthenticatedRequest).user.id, username);
        return reply.send({ success: true });
    } catch (error) {
        console.error("Error in blockUserHandler:", error);
        return reply.status(500).send({ success: false, message: "Erreur serveur" });
    }
};

const unblockUserHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const { username } = request.body as { username: string };
        if (!username) return reply.status(400).send({ success: false, message: "Username required" });
        await dbManager.unblockUser((request as AuthenticatedRequest).user.id, username);
        return reply.send({ success: true });
    } catch (error) {
        console.error("Error in unblockUserHandler:", error);
        return reply.status(500).send({ success: false, message: "Erreur serveur" });
    }
};

const isBlockedHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const { username } = request.body as { username: string };
        if (!username) return reply.status(400).send({ success: false, message: "Username required" });
        const isBlocked = await dbManager.isUserBlocked((request as AuthenticatedRequest).user.id, username);
        return reply.send({ success: true, isBlocked });
    } catch (error) {
        console.error("Error in isBlockedHandler:", error);
        return reply.status(500).send({ success: false, message: "Erreur serveur" });
    }
};

function isValidUsername(username: string)
{
    const usernameRegex = /^(?=.{3,20}$)(?!.*[_.-]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
    return usernameRegex.test(username);
}

const changeUsernameHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const user = await dbManager.getUserById((request as AuthenticatedRequest).user.id);
        if (!user || !user.id)
        {
            return reply.status(404).send
            ({
                success: false,
                message: "User not found"
            });
        }
        const newUsername = (request.body as { newUsername: string }).newUsername;
        if (!newUsername)
        {
            return reply.status(400).send({ success: false, message: "New username required" });
        }
        if (newUsername === user.username)
        {
            return reply.status(400).send({ success: false, message: "New username cannot be the same as the current username" });
        }
        const userWithNewUsername = await dbManager.getUserByUsername(newUsername);
        if (userWithNewUsername)
        {
            return reply.status(400).send({ success: false, message: "Username already exists" });
        }
        if (!isValidUsername(newUsername))
        {
            return reply.status(400).send({ success: false, message: "Invalid username" });
        }
        await dbManager.updateUsername(user.id, newUsername);
        return reply.send
        ({
            success: true,
            message: "Username updated successfully"
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
}

function isValidEmail(email: string)
{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const changeEmailHandler = async (request: FastifyRequest, reply: FastifyReply) =>
{
    try
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const user = await dbManager.getUserById((request as AuthenticatedRequest).user.id);
        if (!user || !user.id)
        {
            return reply.status(404).send
            ({
                success: false,
                message: "User not found"
            });
        }
        const newEmail = (request.body as { newEmail: string }).newEmail;
        if (!newEmail)
        {
            return reply.status(400).send({ success: false, message: "New email required" });
        }
        if (newEmail === user.email)
        {
            return reply.status(400).send({ success: false, message: "New email cannot be the same as the current email" });
        }
        const userWithNewEmail = await dbManager.getUserByEmail(newEmail);
        if (userWithNewEmail)
        {
            return reply.status(400).send({ success: false, message: "Email already exists" });
        }
        if (!isValidEmail(newEmail))
        {
            return reply.status(400).send({ success: false, message: "Invalid email" });
        }
        await dbManager.updateEmail(user.id, newEmail);
        return reply.send
        ({
            success: true,
            message: "Email updated successfully"
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
}

export const userRoutes = 
{
    getInfos: getInfosHandler,
    getUserLibrary: getUserLibraryHandler,
    getAllUsers: getAllUsersHandler,
    addGame: addGameHandler,
    changePassword: changePasswordHandler,
    blockUser: blockUserHandler,
    unblockUser: unblockUserHandler,
    isBlocked: isBlockedHandler,
    changeUsername: changeUsernameHandler,
    changeEmail: changeEmailHandler
};
