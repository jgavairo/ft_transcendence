import express from "express";
import cors from "cors";
import { dbManager } from "./database/database";
const app = express();
const port = 3000;

app.use(cors({
    origin: true,  // Accepte toutes les origines en développement
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
