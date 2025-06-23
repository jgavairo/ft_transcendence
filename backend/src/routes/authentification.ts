import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { dbManager } from "../database/database.js";
import { app, JWT_SECRET, userSocketMap } from "../server.js";
import { transporter } from './user.js';

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

        const usernameRegex = /^[a-zA-Z0-9_-]{5,20}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).send({
                success: false,
                message: "Connection failed"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,25}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send({
                success: false,
                message: "Connection failed"
            });
        }
        
        const user = await dbManager.getUserByUsername(username);
        
        if (!user || !user.id) 
        {
            return res.status(401).send({
                success: false,
                message: "Connection failed"
            });
        }
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).send({
                success: false,
                message: "Connection failed"
            });
        }
        if (userSocketMap.get(username))
        {
            const socketId = userSocketMap.get(username);
            if (socketId)
            {
                app.io.of('/notification').to(socketId).emit('logout', { username: username });
            }
        }
        const is2faEnabled = user.two_factor_enabled;
        if (is2faEnabled)
        {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await dbManager.set2FACode(user.id, code);
            transporter.sendMail({
                from: process.env.EMAIL_ADDRESS,
                to: user.email,
                subject: "Your 2FA Code - ft_transcendence",
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
            });
            return res.status(200).send({
                success: true,
                message: "2FA",
            });
        }
        else
        {
            const token = jwt.sign
            (
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
    
            res.setCookie
            ('token', token, 
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000
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
        if (!username || !password || !email)
        {
            return res.status(400).send({
                success: false,
                message: "Username, password and email are required"
            });
        }

        const usernameRegex = /^[a-zA-Z0-9_-]{5,15}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).send({
                success: false,
                message: "Username must be between 5 and 15 characters and can only contain letters, numbers, underscores and hyphens"
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,25}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send({
                success: false,
                message: "Password must be between 8 and 25 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%#*?&)"
            });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]{1,30}@[a-zA-Z0-9.-]{1,30}\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({
                success: false,
                message: "Please enter a valid email address (max 65 characters)"
            });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const userID = await dbManager.registerUser
        ({
            username: username,
            email: email,
            password_hash: password_hash,
            profile_picture: '../assets/profile_pictures/default.webp',
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

interface GoogleAuthResult {
    success: boolean;
    message?: string;
    token?: string;
}

export const googleAuthHandler = async (userInfo: { email?: string; name?: string; picture?: string }): Promise<GoogleAuthResult> => {
    const { email, name, picture } = userInfo;
    console.log("Google auth handler called with:", { email, name, picture });

    if (!email) 
    {
        console.error("No email provided by Google");
        return { success: false, message: "Google n'a pas renvoyé d'email, impossible de créer le compte." };
    }

    let user = await dbManager.getUserByEmail(email);
    console.log("User found in database:", user);

    if (user && !user.is_google_account)
    {
        console.log("User already exists and is not a google account");
        return { success: false, message: "User already exists and is not a google account" };
    }

    if (!user)
    {
        let username = email.split('@')[0];
        username = username.replace(/[^a-zA-Z0-9]/g, '');
        console.log("Generated username:", username);
        console.log("Creating new user");
        const userID = await dbManager.registerUser({
            username: username,
            email: email,
            password_hash: '',
            profile_picture: picture || '../assets/profile_pictures/default.webp',
            friends: [],
            friend_requests: [],
            attempting_friend_ids: [],
            is_google_account: true
        });
        user = await dbManager.getUserById(userID);
        console.log("New user created:", user);
    }

    if (!user)
    {
        console.error("Failed to create or find user");
        return { success: false, message: "Failed to create or find user" };
    }

    if (userSocketMap.get(user.username))
    {
        const socketId = userSocketMap.get(user.username);
        if (socketId)
        {
            app.io.of('/notification').to(socketId).emit('logout', { username: user.username });
        }
    }

    console.log("Generating JWT token for user:", user.id);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    console.log("Token generated successfully");
    
    return { success: true, token };
};

const confirm2FAHandler = async (req: FastifyRequest, res: FastifyReply) => 
{
    const { username, code } = req.body as { username: string; code: string };

    const codeRegex = /^[0-9]{6}$/;
    if (!codeRegex.test(code))
    {
        return res.status(401).send({ success: false, message: "Invalid code" });
    }

    const user = await dbManager.getUserByUsername(username);
    if (!user)
    {
        return res.status(401).send({ success: false, message: "User not found" });
    }
    if (user.two_factor_code !== code)
    {
        return res.status(401).send({ success: false, message: "Invalid code" });
    }
    if (!user.two_factor_code_expiration || user.two_factor_code_expiration < Date.now())
    {
        return res.status(401).send({ success: false, message: "Code expired" });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
    });

    return res.status(200).send({ 
        success: true, 
        message: "2FA confirmed",
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profile_picture: user.profile_picture
        }
    });
};

export const authRoutes = 
{
    login: loginHandler,
    register: registerHandler,
    checkAuth: checkAuthHandler,
    logout: logoutHandler,
    googleAuth: googleAuthHandler,
    confirm2FA: confirm2FAHandler
};
