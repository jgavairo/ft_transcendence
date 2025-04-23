import fastify from 'fastify';
import fastifyExpress from '@fastify/express';
import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "./database/database.js";
import { userRoutes } from "./routes/user.js";
import { authRoutes } from "./routes/authentification.js";
import { Server as SocketIOServer } from "socket.io";
import { startMatch, MatchState } from "./games/pong/gameSimulation.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import { chatRoutes } from './routes/chat.js';
import { gameRoutes } from './routes/game.js';

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
const initializePlugins = async () => {
    
    
    // Configuration CORS
    await app.register(import('@fastify/cors'), {
        origin: 'http://127.0.0.1:8080',
        credentials: true
    });
    
    await app.register(import('@fastify/cookie'), {
        secret: JWT_SECRET,
        parseOptions: {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        }
    });
    
    await app.register(import('@fastify/static'), {
        root: path.join(__dirname, '..', 'uploads'),
        prefix: '/uploads/'
    });

};

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

/////////////////
// GAME ROUTES //
/////////////////

app.get('/api/games/getAll', async (request: FastifyRequest, reply: FastifyReply) => {
    return gameRoutes.getAllGames(request, reply);
});

////////////////////////////////////////////
//              SERVER START              //
////////////////////////////////////////////

const start = async () => 
{
    try
    {
        await initializePlugins();
        await dbManager.initialize();
        
        // Démarrer le serveur Fastify
        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log(`Fastify server is running on port 3000`);
        
        // Configurer Socket.IO après que le serveur Fastify soit démarré
        const io = new SocketIOServer(app.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Cookie", "Authorization"]
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true // Compatibilité avec les anciennes versions
        });
        
        console.log(`Socket.IO server is running`);

        // Gestion des événements Socket.IO
        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('sendMessage', async (data, callback) => {
                console.log('Message received:', data);
                try {
                    // Sauvegarder le message dans la base de données
                    await dbManager.saveMessage(data.author, data.content);
                    
                    // Diffuser le message à tous les clients connectés
                    io.emit('receiveMessage', {
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
