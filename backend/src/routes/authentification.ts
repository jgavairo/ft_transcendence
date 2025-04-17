import { RequestHandler } from "express";
import jwt from 'jsonwebtoken';
import { dbManager } from "../database/database";
import { JWT_SECRET } from "../server";

const loginHandler: RequestHandler = async (req, res) => {
    try
    {

        const { username, password } = req.body;
        console.log('connection tentative -');
        console.log("username: " + username, "password: " + password);
        
        const user = await dbManager.getUserByUsername(username);
        
        if (!user)
        {
            res.json({
                success: false,
                message: "User not found"
            });
        }
        else
        {
            if (user.password_hash !== password)
            {
                res.json({
                    success: false,
                    message: "Invalid password"
                });
            }
            else
            {
                const token = jwt.sign(
                    { userId: user.id },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000
                });

                res.json({
                    success: true,
                    message: "Login successful",
                    user: user.id
                });
            }
        }
    }
    catch (error)
    {
        res.json({
            success: false,
            message: "Login failed"
        });
    }
};


const registerHandler: RequestHandler = async (req, res) => {
    console.log("Registering user");
    const {username, password, email} = req.body;
    try
    {
        const userID = await dbManager.registerUser({
            username: username,
            email: email,
            password_hash: password,
            profile_picture: '../assets/profile_pictures/default.png',
        });
        res.json({
            success: true,
            message: "User registered successfully",
            userID: userID
        });
    }
    catch (error)
    {
        res.json({
            success: false,
            message: "User registration failed",
            error: error
        });
    }
};


const checkAuthHandler: RequestHandler = async (req, res) => 
{
    try
    {
        const token = req.cookies.token;
        if (!token)
            {
                res.json({
                    success: false,
                    message: "User non authenified"
                });
                return;
            }
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
            const user = await dbManager.getUserById(decoded.userId);
            if (!user)
            {
                res.json({
                    success: false,
                    message: "User not found"
                });
                return;
            }
            res.json({
                success: true,
                message: "User authenified",
                user: user
            });
        }
        catch (error)
        {
            res.json({
                success: false,
                message: "Invalid token"
			});
	}
};

    
const logoutHandler: RequestHandler = async (req, res) => 
{
	res.clearCookie('token', {
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		path: '/'
	});
	res.json({
		success: true,
		message: "User logged out"
	});
}

export const authRoutes = 
{
	login: loginHandler,
	register: registerHandler,
	checkAuth: checkAuthHandler,
	logout: logoutHandler
}
