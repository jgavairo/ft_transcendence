import express from "express";
import cors from "cors";
import { dbManager } from "./database/database";
import cookieParser from 'cookie-parser';
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/authentification";

const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_par_défaut';
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
