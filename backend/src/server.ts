import express from "express";
import cors from "cors";
import jwt from 'jsonwebtoken';
import { dbManager } from "./database/database";

const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_par_défaut';
const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://127.0.0.1:8080',  // Accepte toutes les origines en développement
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

////////////////////////////////////////////////
//           Start of the server              //
////////////////////////////////////////////////

app.get("/", (req, res) => {
    res.json({ message: "API ft_transcendence" });
});

app.listen(port, async () => {
    try
    {
        await dbManager.initialize();
    }
    catch (error)
    {
        console.error('Error while initializing the database:', error);
    }
    console.log(`Server is running on port ${port}`);
});

////////////////////////////////////////////////
//           List of the routes               //
////////////////////////////////////////////////

app.post("/api/login", async (req, res) => {
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
});

app.post('/api/register', async (req, res) => {
    console.log("Registering user");
    const {username, password, email} = req.body;
    try
    {
        const userID = await dbManager.registerUser({
            username: username,
            email: email,
            password_hash: password
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
});
//npx ts-node src/server.ts
