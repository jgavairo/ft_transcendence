import fastify from 'fastify';
import fastifyExpress from '@fastify/express';
import fastifyCors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import fastifyCookie from '@fastify/cookie'
import fastifySocketIO from 'fastify-socket.io'
import { FastifyRequest, FastifyReply } from 'fastify';
import type { Socket } from 'socket.io'
import { dbManager } from "./database/database.js";
import { userRoutes } from "./routes/user.js";
import { authRoutes } from "./routes/authentification.js";
import { startMatch, MatchState } from "./games/pong/gameSimulation.js";
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import { chatRoutes } from './routes/chat.js';

// Obtenir l'équivalent de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const JWT_SECRET = process.env.JWT_SECRET || ''

// Créer l'application Fastify
const app = fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024 // 10MB
});

// Fonction d'initialisation des plugins
await app.register(fastifyExpress);

// Configuration CORS
await app.register(fastifyCors, {
    origin: 'http://127.0.0.1:8080',
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Cookie'],
    exposedHeaders: ['Set-Cookie']
});

await app.register(fastifyCookie, {
    secret: JWT_SECRET,
    parseOptions: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    }
});

await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/'
}); 

await app.register(fastifySocketIO, {
    cors: {
        origin: 'http://127.0.0.1:8080',
        credentials: true
    },
    transports: ['websocket','polling'],
    allowEIO3: true
    })

// Créer le dossier pour les uploads s'il n'existe pas
const uploadDir = 'uploads/profile_pictures';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

////////////////////////////////////////////
//                 ROUTES                 //
////////////////////////////////////////////


/////////////////
// AUTH ROUTES //
/////////////////

app.get("/api/auth/check", async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.checkAuth(request, reply);
});

app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.register(request, reply);
});

app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.login(request, reply);
});

app.get("/api/auth/logout", { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.logout(request, reply);
});

/////////////////
// USER ROUTES //
/////////////////

app.get('/api/users', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getAllUsers(request, reply);
});

app.get('/api/user/infos', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getInfos(request, reply);
});

app.get('/api/user/library', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getUserLibrary(request, reply);
});

app.post('/api/user/addGame', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.addGame(request, reply);
});

////////////////////
// PROFILE ROUTES //
////////////////////

app.post('/api/profile/changePicture', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.changePicture(request, reply);
});

app.post('/api/profile/updateBio', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.updateBio(request, reply);
});

/////////////////
// CHAT ROUTES //
/////////////////

app.get('/api/chat/history', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return chatRoutes.getChatHistory(request, reply);
});


////////////////////////////////////////////////
//                Matchmaking                 //
////////////////////////////////////////////////

const gameNs = app.io.of('/game');
// Global map pour stocker l'état de chaque match par roomId
const matchStates: Map<string, MatchState> = new Map();

// Interface pour représenter un joueur
interface Player {
    id: string;
    username: string;
}

// File d'attente des joueurs pour le matchmaking
let matchmakingQueue: Player[] = [];


// Gestion des connexions Socket.IO
gameNs.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on("joinQueue", (playerData) => {
        console.log(`Player ${socket.id} joined matchmaking.`, playerData);
        matchmakingQueue.push({ id: socket.id, username: playerData.username });
        attemptMatch();
    });
    
    // Gestion des messages de chat
    socket.on("sendMessage", async (messageData: { author: string, content: string }) => {
        console.log(`Message received from ${messageData.author}: ${messageData.content}`);
        
        // Ajouter l'ID du socket à l'objet messageData
        const messageWithId = { ...messageData, senderId: socket.id };
        
        // Sauvegarder le message dans la base de données
        try {
            await dbManager.saveMessage(messageData.author, messageData.content);
        } catch (error) {
            console.error("Error saving message to database:", error);
        }

        // Diffuser le message à tous les utilisateurs connectés
        gameNs.emit("receiveMessage", messageWithId);
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
        const matchState = startMatch(player1, player2, gameNs);
        matchStates.set(matchState.roomId, matchState);
      }
    }
  }


////////////////////////////////////////////
//              SERVER START              //
////////////////////////////////////////////

const start = async () => {
    try {
        await dbManager.initialize();
        
        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Fastify server + Socket.IO OK sur port 3000');

        // Gestion des événements Socket.IO
        const chatNs = app.io.of('/chat');
        chatNs.on('connection', (socket: Socket) => {
            console.log('Client connected:', socket.id);

            socket.on('sendMessage', async (data, callback) => {
                console.log('Message received:', data);
                try {
                    // Sauvegarder le message dans la base de données
                    await dbManager.saveMessage(data.author, data.content);
                    
                    // Diffuser le message à tous les clients connectés
                    socket.broadcast.emit('receiveMessage', {
                        author: data.author,
                        content: data.content,
                        timestamp: new Date().toISOString()
                      });

                    if (callback) {
                        callback({ success: true });
                    }
                } catch (error) {
                    console.error('Error saving message:', error);
                    if (callback) {
                        callback({ success: false, error: 'Failed to save message' });
                    }
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    } catch (err) {
        console.error('Error while starting the server:', err);
        process.exit(1);
    }
};

start();
