import express from "express";
import cors from "cors";
import { dbManager } from "./database/database";
import cookieParser from 'cookie-parser';
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/authentification";
import http from "http";
import { Server as SocketIOServer, Socket} from "socket.io";
import { startMatch, MatchState } from "./games/pong/gameSimulation";

import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import passport from 'passport';

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

app.use(session({
    secret: 
}))

// Créer le dossier pour les uploads s'il n'existe pas
const uploadDir = 'uploads/profile_pictures';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

////////////////////////////////////////////
//           List of routes               //
////////////////////////////////////////////

//auth routes
app.get("/api/auth/check", authRoutes.checkAuth);
app.post('/api/auth/register', authRoutes.register);
app.post('/api/auth/login', authRoutes.login);
app.get("/api/auth/logout", authRoutes.logout);

//community routes
app.get('/api/users', userRoutes.getAllUsernames);

//user routes
app.get('/api/header', userRoutes.getInfos);
app.get('/api/getLibrary', userRoutes.getUserLibrary);
app.post('/api/addGame', userRoutes.addGame);
app.post('/api/profile/changePicture', upload.single('newPicture'), userRoutes.changePicture);
// Servir les fichiers statiques

////////////////////////////////////////////////
//                Matchmaking                 //
////////////////////////////////////////////////

//Création du serveur HTTP et intégration de Socket.IO
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://127.0.0.1:8080',
        methods: ["GET", "POST"],
        credentials: true
    }
});


// Global map pour stocker l'état de chaque match par roomId
const matchStates: Map<string, MatchState> = new Map();

// Interface pour représenter un joueur
interface PlayerData {
    username: string;
  }

  interface Player {
    id: string;
    username: string;
  }

// File d'attente des joueurs pour le matchmaking
let matchmakingQueue: Player[] = [];

// Gestion des connexions Socket.IO
io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("joinQueue", (playerData) => {
        console.log(`Player ${socket.id} joined matchmaking.`, playerData);
        matchmakingQueue.push({ id: socket.id, username: playerData.username });
        attemptMatch();
    });
    socket.on("movePaddle", (data: { paddle: "left" | "right"; direction: "up" | "down" | null }) => {
        const rooms = Array.from(socket.rooms);
        const roomId = rooms.find(r => r !== socket.id);
        if (!roomId) return;
    
        const matchState = matchStates.get(roomId);
        if (!matchState) return;
    
        if (data.paddle === "left") {
          matchState.leftPaddleDirection = data.direction;
        } else if (data.paddle === "right") {
          matchState.rightPaddleDirection = data.direction;
        }
      })
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        matchmakingQueue = matchmakingQueue.filter(player => player.id !== socket.id);
    });
});
  
//connecter deux joueurs
function attemptMatch(): void {
    if (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();
      if (player1 && player2) {
        console.log(`Match found: ${player1.id} vs ${player2.id}`);
        const matchState = startMatch(player1, player2, io);
        matchStates.set(matchState.roomId, matchState);
      }
    }
  }
////////////////////////////////////////////////
//           Start of the server              //
////////////////////////////////////////////////

server.listen(port, async () => {
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
