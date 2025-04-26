import fastify from 'fastify';
import fastifyExpress from '@fastify/express';
import fastifyCors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifySocketIO from 'fastify-socket.io'
import { FastifyRequest, FastifyReply } from 'fastify';
import type { Socket } from 'socket.io'
import { dbManager } from "./database/database.js";
import { userRoutes } from "./routes/user.js";
import { authRoutes } from "./routes/authentification.js";
import { profileRoutes } from './routes/profile.js';
import { startMatch, MatchState } from "./games/pong/gameSimulation.js";
import fs from 'fs';
import { authMiddleware } from './middleware/auth.js';
import { chatRoutes } from './routes/chat.js';
import { gameRoutes } from './routes/game.js';
import fastifyMultipart from '@fastify/multipart';


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

// Configuration Multipart pour l'upload de fichiers
await app.register(fastifyMultipart, {
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        fieldNameSize: 200,
        fieldSize: 200,
        fields: 10
    }
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

await app.register(fastifySocketIO, {
    cors: {
        origin: 'http://127.0.0.1:8080',
        credentials: true
    },
    transports: ['websocket','polling'],
    allowEIO3: true
    })

app.io.on('connection', socket => {
    console.log('Default namespace connected:', socket.id);
    });

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
    return profileRoutes.changePicture(request, reply);
});

app.post('/api/profile/updateBio', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return profileRoutes.updateBio(request, reply);
});

/////////////////
// CHAT ROUTES //
/////////////////

app.get('/api/chat/history', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return chatRoutes.getChatHistory(request, reply);
});

/////////////////
// GAME ROUTES //
/////////////////

app.get('/api/games/getAll', async (request: FastifyRequest, reply: FastifyReply) => {
    return gameRoutes.getAllGames(request, reply);
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
    

    socket.on('startSolo', ({ username }) => {
        const match = startMatch(socket, socket, gameNs);
        matchStates.set(match.roomId, match);

        socket.emit('matchFound', { roomId: match.roomId });
      });
    
      socket.on('joinQueue', ({ username }) => {
        // 1) On inscrit ce joueur dans la file
        matchmakingQueue.push({ id: socket.id, username });
        // 2) On tente d'associer deux joueurs
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
        matchmakingQueue = matchmakingQueue.filter(player => player.id !== socket.id);
    });
});

//connecter deux joueurs
function attemptMatch(): void {
    while (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift()!;
      const player2 = matchmakingQueue.shift()!;
      console.log(`Match found: ${player1.id} vs ${player2.id}`);

      const matchState = startMatch(
        gameNs.sockets.get(player1.id)!,
        gameNs.sockets.get(player2.id)!,
        gameNs
      );
      matchStates.set(matchState.roomId, matchState);

      gameNs.to(player1.id).emit('matchFound', { roomId: matchState.roomId });
      gameNs.to(player2.id).emit('matchFound', { roomId: matchState.roomId });
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

            socket.on('sendMessage', async (data, callback) => {
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
