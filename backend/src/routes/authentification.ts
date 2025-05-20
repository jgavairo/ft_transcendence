import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { dbManager } from "../database/database.js";
import { JWT_SECRET } from "../server.js";

const loginHandler = async (req: FastifyRequest, res: FastifyReply) => {
    try 
    {
        console.log("Login attempt");

        const { username, password } = req.body as { username: string; password: string };
        
        if (!username || !password)
        {
            return res.status(400).send({
                success: false,
                message: "Username and password are required"
            });
        }
        
        const user = await dbManager.getUserByUsername(username);
        
        if (!user) 
        {
            return res.status(401).send({
                success: false,
                message: "User not found with this username: " + username
            });
        }
        
        // Comparaison sécurisée avec bcrypt
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).send({
                success: false,
                message: "Password is incorrect for this username: " + username
            });
        }
        
        const token = jwt.sign
        (
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.setCookie
        ('token', token, 
        {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        return res.send
        ({
            success: true,
            message: "Connection successful",
            user: 
            {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture
            }
        });
    } 
    catch (error) 
    {
        console.error("Erreur de connexion:", error);
        return res.status(500).send({
            success: false,
            message: "Erreur lors de la connexion"
        });
    }
};

const registerHandler = async (req: FastifyRequest, res: FastifyReply) => 
{
    console.log("User registration attempt");

    const { username, password, email } = req.body as { username: string; password: string; email: string };

    try 
    {
        // Hashage du mot de passe avec bcrypt
        const password_hash = await bcrypt.hash(password, 10);

        const userID = await dbManager.registerUser
        ({
            username: username,
            email: email,
            password_hash: password_hash,
            profile_picture: '../assets/profile_pictures/default.png',
            friends: [],
            friend_requests: [],
            attempting_friend_ids: []
        });

        return res.send
        ({
            success: true,
            message: "User registration successful",
            userID: userID
        });
    } 
    catch (error) 
    {
        return res.send
        ({
            success: false,
            message: "User registration failed",
            error: error
        });
    }
};

const checkAuthHandler = async (req: FastifyRequest, res: FastifyReply) => 
{
    try 
    {
        const token = req.cookies.token;

        if (!token)
        {
            return res.send({
                success: false,
                message: "User is not authenified"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

        const user = await dbManager.getUserById(decoded.userId);
        
        if (!user)
        {
            return res.send
            ({
                success: false,
                message: "User not found"
            });
        }

        return res.send
        ({
            success: true,
            message: "User authenified",
            user: user
        });
    } 
    catch (error) 
    {
        return res.send
        ({
            success: false,
            message: "Invalid token"
        });
    }
};

const logoutHandler = async (req: FastifyRequest, res: FastifyReply) => 
{
    res.clearCookie
    ('token', 
    {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    return res.send
    ({
        success: true,
        message: "User logged out"
    });
};

export const googleAuthHandler = async (userInfo: { email?: string; name?: string; picture?: string }) => {
    const { email, name, picture } = userInfo;
    console.log("Google auth handler called with:", { email, name, picture });

    if (!email) 
    {
        console.error("No email provided by Google");
        return { success: false, message: "Google n'a pas renvoyé d'email, impossible de créer le compte." };
    }

    let username = email.split('@')[0];
    username = username.replace(/[^a-zA-Z0-9]/g, '');
    console.log("Generated username:", username);

    let user = await dbManager.getUserByEmail(email);
    console.log("User found in database:", user);

    if (!user)
    {
        console.log("Creating new user");
        const userID = await dbManager.registerUser({
            username: username,
            email: email,
            password_hash: '',
            profile_picture: picture || '../assets/profile_pictures/default.png',
            friends: [],
            friend_requests: [],
            attempting_friend_ids: []
        });
        user = await dbManager.getUserById(userID);
        console.log("New user created:", user);
    }

    if (!user)
    {
        console.error("Failed to create or find user");
        return { success: false, message: "problem with google auth" };
    }

    console.log("Generating JWT token for user:", user.id);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    console.log("Token generated successfully");
    
    return { user, token };
};

export const authRoutes = 
{
    login: loginHandler,
    register: registerHandler,
    checkAuth: checkAuthHandler,
    logout: logoutHandler,
    googleAuth: googleAuthHandler
};
