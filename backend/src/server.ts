import fastify from 'fastify';
import fastifyExpress from '@fastify/express';
import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "./database/database.js";
import { userRoutes } from "./routes/user.js";
import { authRoutes } from "./routes/authentification.js";
import { Server as SocketIOServer } from "socket.io";
import { startMatch, MatchState } from "./games/pong/gameSimulation.js";
import http from "http";
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';
import { chatRoutes } from './routes/chat.js';
// Obtenir l'équivalent de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const JWT_SECRET = process.env.JWT_SECRET || '6d239a75c7b0219b01411336aec34a4c10e9ff3e43d5382100eba4268c5bfa0572e90558e5367cb169de6d43a2e8542cd3643a5d0494c8ac192566a40e86d44c';

// Créer l'application Fastify
const app = fastify({
  logger: true
});

// Configuration de multer pour les uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pictures');
    },
    filename: (req, file, cb) => {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        cb(null, `${decoded.userId}.jpg`);
    }
});

const upload = multer({ storage: storage });

// Fonction d'initialisation des plugins
const initializePlugins = async () => {
    await app.register(fastifyExpress);
    
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
    
    await app.register(import('@fastify/multipart'), {
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB
        }
    });
};

// Créer le dossier pour les uploads s'il n'existe pas
const uploadDir = 'uploads/profile_pictures';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes d'authentification
app.get("/api/auth/check", async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.checkAuth(request, reply);
});

app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.register(request, reply);
});

app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.login(request, reply);
});

app.get("/api/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.logout(request, reply);
});

// Routes communautaires
app.get('/api/users', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getAllUsers(request, reply);
});

// Routes protégées
app.get('/api/user/infos', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getInfos(request, reply);
});

app.get('/api/user/library', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getUserLibrary(request, reply);
});

app.get('/api/getLibrary', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getUserLibrary(request, reply);
});

app.post('/api/user/addGame', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.addGame(request, reply);
});

app.post('/api/addGame', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.addGame(request, reply);
});

app.get('/api/header', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.getInfos(request, reply);
});

app.post('/api/profile/changePicture', {
    preHandler: [authMiddleware, async (request: FastifyRequest, reply: FastifyReply) => {
        const file = await request.file();
        if (!file) {
            return reply.status(400).send({
                success: false,
                message: "Aucun fichier n'a été uploadé"
            });
        }
    }]
}, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.changePicture(request, reply);
});

app.post('/api/profile/updateBio', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.updateBio(request, reply);
});

// Route du chat
app.get('/api/chat/history', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return chatRoutes.getChatHistory(request, reply);
});

// Démarrage du serveur Fastify sur le port 3000
const start = async () => {
    try {
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
