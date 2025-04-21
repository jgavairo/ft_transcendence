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
import session from 'express-session';
import passport from './config/passport.js';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';

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
    
    // Configuration CORS améliorée
    await app.register(import('@fastify/cors'), {
        origin: true, // Permet toutes les origines en développement
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Cookie', 'Authorization'],
        exposedHeaders: ['Set-Cookie'],
        maxAge: 86400
    });
    
    await app.register(import('@fastify/cookie'), {
        secret: JWT_SECRET,
        parseOptions: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
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

// Configuration de la session Express
app.addHook('onRequest', (request, reply, done) => {
    const expressReq = request.raw as Request;
    const expressRes = reply.raw as Response;
    session({
        secret: JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        }
    })(expressReq, expressRes, done);
});

// Initialisation de Passport
app.addHook('onRequest', (request, reply, done) => {
    const expressReq = request.raw as Request;
    const expressRes = reply.raw as Response;
    passport.initialize()(expressReq, expressRes, done);
});

app.addHook('onRequest', (request, reply, done) => {
    const expressReq = request.raw as Request;
    const expressRes = reply.raw as Response;
    passport.session()(expressReq, expressRes, done);
});

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

// Routes d'authentification Google
app.get('/api/auth/google', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.google(request, reply);
});

app.get('/api/auth/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.googleCallback(request, reply);
});

// Routes communautaires
app.get('/api/users', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const users = await dbManager.getAllUsernamesWithIds();
        return reply.send({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching usernames:', error);
        return reply.status(500).send({
            success: false,
            message: "Erreur lors de la récupération des utilisateurs"
        });
    }
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
    try {
        const messages = await dbManager.getLastMessages(10);
        return reply.send({ success: true, messages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return reply.status(500).send({
            success: false,
            message: "Error fetching chat history"
        });
    }
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
