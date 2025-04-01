import express from "express";
import cors from "cors";
import { dbManager } from "./database/database";
import cookieParser from 'cookie-parser';
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/authentification";

export const JWT_SECRET = process.env.JWT_SECRET || '6d239a75c7b0219b01411336aec34a4c10e9ff3e43d5382100eba4268c5bfa0572e90558e5367cb169de6d43a2e8542cd3643a5d0494c8ac192566a40e86d44c';
const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://127.0.0.1:8080',  // Accepte toutes les origines en développement
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(cookieParser());

////////////////////////////////////////////////
//           Start of the server              //
////////////////////////////////////////////////

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

////////////////////////////////////////////
//           List of routes               //
////////////////////////////////////////////
    
    //auth routes
    app.get("/api/auth/check", authRoutes.checkAuth);
    app.post('/api/auth/register', authRoutes.register);
    app.post('/api/auth/login', authRoutes.login);
    app.get("/api/auth/logout", authRoutes.logout);


    //user routes
    app.get('/api/header', userRoutes.getInfos);
    app.get('/api/getLibrary', userRoutes.getUserLibrary);