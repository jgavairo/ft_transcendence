import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";
import { authMiddleware } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: 
    {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
});

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
                library: user.library || [],
                two_factor_enabled: user.two_factor_enabled,
                two_factor_code: user.two_factor_code,
                two_factor_code_expiration: user.two_factor_code_expiration
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

const send2FACodeHandler = async (request: FastifyRequest, reply: FastifyReply) => 
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
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await dbManager.update2FACode(user.id, code);
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: user.email,
            subject: 'Your 2FA Code - ft_transcendence',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Your Two-Factor Authentication Code</h2>
                    <p>Here is your verification code:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 5px;">
                        ${code}
                    </h1>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);
        return reply.send({ success: true, code });
    }
    catch (error)
    {
        console.error("process.env.EMAIL_ADDRESS:", process.env.EMAIL_ADDRESS);
        console.error("process.env.EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD);
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
}

const enable2FAHandler = async (request: FastifyRequest, reply: FastifyReply) => 
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
        const code = (request.body as { code: string }).code;
        if (!code)
        {
            return reply.status(400).send({ success: false, message: "Code required" });
        }
        if (code !== user.two_factor_code)
        {
            return reply.status(401).send({ success: false, message: "Invalid code" });
        }
        const date = Date.now();
        if (!user.two_factor_code_expiration || user.two_factor_code_expiration < date)
        {
            return reply.status(401).send({ success: false, message: "Code expired" });
        }
        await dbManager.enable2FA(user.id);
        return reply.send({ success: true });
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

const disable2FAHandler = async (request: FastifyRequest, reply: FastifyReply) => 
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
        const password = (request.body as { password: string }).password;
        if (!password)
        {
            return reply.status(400).send({ success: false, message: "Password required" });
        }
        const realPasswordHash = await dbManager.getUserPassword(user.id);
        const isValid = await bcrypt.compare(password, realPasswordHash);
        if (!isValid)
        {
            return reply.status(401).send({ success: false, message: "Invalid password" });
        }
        await dbManager.disable2FA(user.id);
        return reply.send({ success: true });
    }
    catch (error)
    {
        console.error("Erreur détaillée:", error);
        
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
    changeEmail: changeEmailHandler,
    send2FACode: send2FACodeHandler,
    enable2FA: enable2FAHandler,
    disable2FA: disable2FAHandler
};
