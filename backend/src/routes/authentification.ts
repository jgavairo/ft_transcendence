import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { dbManager } from "../database/database.js";
import { JWT_SECRET } from "../server.js";

interface AuthenticatedRequest extends FastifyRequest {
    user?: any;
}

const loginHandler = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const { username, password } = req.body as { username: string; password: string };
        console.log('connection tentative -');
        console.log("username: " + username, "password: " + password);
        
        const user = await dbManager.getUserByUsername(username);
        
        if (!user) {
            return res.status(401).send({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }
        
        if (user.password_hash !== password) {
            return res.status(401).send({
                success: false,
                message: "Mot de passe incorrect"
            });
        }
        
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.setCookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        return res.send({
            success: true,
            message: "Connexion réussie",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture
            }
        });
    } catch (error) {
        console.error("Erreur de connexion:", error);
        return res.status(500).send({
            success: false,
            message: "Erreur lors de la connexion"
        });
    }
};

const registerHandler = async (req: FastifyRequest, res: FastifyReply) => {
    console.log("Registering user");
    const { username, password, email } = req.body as { username: string; password: string; email: string };
    try {
        const userID = await dbManager.registerUser({
            username: username,
            email: email,
            password_hash: password,
            profile_picture: '../assets/profile_pictures/default.png',
        });
        return res.send({
            success: true,
            message: "User registered successfully",
            userID: userID
        });
    } catch (error) {
        return res.send({
            success: false,
            message: "User registration failed",
            error: error
        });
    }
};

const checkAuthHandler = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.send({
                success: false,
                message: "User non authenified"
            });
        }
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const user = await dbManager.getUserById(decoded.userId);
        if (!user) {
            return res.send({
                success: false,
                message: "User not found"
            });
        }
        return res.send({
            success: true,
            message: "User authenified",
            user: user
        });
    } catch (error) {
        return res.send({
            success: false,
            message: "Invalid token"
        });
    }
};

const logoutHandler = async (req: FastifyRequest, res: FastifyReply) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });
    return res.send({
        success: true,
        message: "User logged out"
    });
};

export const authRoutes = {
    login: loginHandler,
    register: registerHandler,
    checkAuth: checkAuthHandler,
    logout: logoutHandler
};
