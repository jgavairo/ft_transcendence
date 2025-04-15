import express from "express";
import cors from "cors";
import { dbManager } from "./database/database";
import cookieParser from 'cookie-parser';
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/authentification";
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || '6d239a75c7b0219b01411336aec34a4c10e9ff3e43d5382100eba4268c5bfa0572e90558e5367cb169de6d43a2e8542cd3643a5d0494c8ac192566a40e86d44c';
const app = express();
const port = 3000;

// Configuration de multer pour les uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pictures');
    },
    filename: (req, file, cb) => {
        // Récupérer l'ID de l'utilisateur depuis le token
        const token = req.cookies.token;
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        cb(null, `${decoded.userId}.jpg`);
    }
});

const upload = multer({ storage: storage });


app.use(cors({
    origin: 'http://127.0.0.1:8080',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

////////////////////////////////////////////////
//           Start of the server              //
////////////////////////////////////////////////

// Créer le dossier pour les uploads s'il n'existe pas
const uploadDir = 'uploads/profile_pictures';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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
    app.post('/api/addGame', userRoutes.addGame);
    app.post('/api/profile/changePicture', upload.single('newPicture'), userRoutes.changePicture);
    // Servir les fichiers statiques
