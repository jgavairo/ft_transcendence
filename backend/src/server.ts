import fastify from 'fastify';
import fastifyExpress from '@fastify/express';
import fastifyCors from '@fastify/cors'
import fastifyCookie from '@fastify/cookie'
import fastifySocketIO from 'fastify-socket.io'
import { FastifyRequest, FastifyReply } from 'fastify';
import type { Socket } from 'socket.io'
import { dbManager } from "./database/database.js";
import { userRoutes, ChangePasswordRequest } from "./routes/user.js";
import { authRoutes, googleAuthHandler } from "./routes/authentification.js";
import { profileRoutes } from './routes/profile.js';
import fs from 'fs';
import { authMiddleware, AuthenticatedRequest } from './middleware/auth.js';
import { chatRoutes } from './routes/chatRoute.js';
import { gameRoutes } from './routes/game.js';
import fastifyMultipart from '@fastify/multipart';
import fastifyOauth2 from '@fastify/oauth2';
import { setupGameMatchmaking } from './games/pong/matchmaking.js';
import type { FastifyPluginAsync } from 'fastify';
import { friendsRoutes } from './routes/friends.js';
export const JWT_SECRET = process.env.JWT_SECRET || ''
export const HOSTNAME = process.env.HOSTNAME || 'localhost'

// Créer l'application Fastify
export const app = fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024 // 10MB
});

// Fonction d'initialisation des plugins
await app.register(fastifyExpress);

// Configuration CORS
await app.register(fastifyCors, {
    origin: true, // Permet toutes les origines
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
    parseOptions: 
    {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    }
});

await app.register(fastifySocketIO, {
    cors: {
        origin: true, // Permet toutes les origines
        credentials: true
    },
    transports: ['websocket','polling'],
    allowEIO3: true
})

app.io.on('connection', socket => {
    console.log('Default namespace connected:', socket.id);
});

app.register(fastifyOauth2 as unknown as FastifyPluginAsync<any>, 
{
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
        client: {
            id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET
        },
        auth: fastifyOauth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/auth/google',
    callbackUri: `http://${HOSTNAME}:3000/api/auth/google/callback`,
    generateStateFunction: () => {
        return 'state_' + Math.random().toString(36).substring(7);
    },
    checkStateFunction: (state: string, callback: (err: Error | null, valid: boolean) => void) => {
        callback(null, true);
    }
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

app.get("/api/auth/google/callback", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        console.log("Google callback received");
        const { token } = await (app as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);
        console.log("Access token received from Google:", token);

        const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 
                Authorization: `Bearer ${token.access_token}`,
                Accept: 'application/json'
            }
        }).then(res => res.json());
        console.log("User info received:", userInfo);

        if (userInfo.error) {
            console.error("Google API error:", userInfo.error);
            return reply.redirect(`http://${HOSTNAME}:8080/login?error=google`);
        }

        const result = await googleAuthHandler(userInfo);
        console.log("Google auth handler result:", result);

        if (!result.token) {
            console.error('No token generated from googleAuthHandler');
            return reply.redirect(`http://${HOSTNAME}:8080/login?error=google`);
        }

        console.log("Setting token cookie:", result.token);
        reply.setCookie('token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        // Supprimer le cookie oauth2-redirect-state
        reply.clearCookie('oauth2-redirect-state', {
            path: '/'
        });

        // Redirige vers le frontend après succès
        return reply.redirect(`http://${HOSTNAME}:8080/`);
    } catch (error) {
        console.error('Error during Google authentication:', error);
        return reply.redirect(`http://${HOSTNAME}:8080/login?error=google`);
    }
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

app.post<{ Body: ChangePasswordRequest }>('/api/user/changePassword', { preHandler: authMiddleware }, async (request, reply) => {
    return userRoutes.changePassword(request, reply);
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

////////////////////
// FRIENDS ROUTES //
////////////////////

app.post('/api/friends/sendRequest', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.sendRequest(request, reply);
});

app.post('/api/friends/isFriend', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.isFriend(request, reply);
});

app.post('/api/friends/isRequesting', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.isRequesting(request, reply);
});

app.post('/api/friends/isRequested', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.isRequested(request, reply);
});

app.post('/api/friends/acceptRequest', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.acceptRequest(request, reply);
});

app.post('/api/friends/removeFriend', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.removeFriend(request, reply);
});

app.post('/api/friends/cancelRequest', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.cancelRequest(request, reply);
});

app.post('/api/friends/refuseRequest', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.refuseRequest(request, reply);
});

app.post('/api/user/isOnline', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.isOnline(request, reply);
});

app.get('/api/friends/allFriendIds', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return friendsRoutes.getAllFriendIds(request, reply);
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

app.get('/api/games/isFirstGame', async (request: FastifyRequest, reply: FastifyReply) => {
    return gameRoutes.isFirstGame(request, reply);
});

//////////////////
// STATS ROUTES //
//////////////////

app.post('/api/games/incrementWins', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { gameId, userId } = request.body as { gameId: number; userId: number };

        if (!gameId || !userId) {
            return reply.status(400).send({ error: 'gameId and userId are required' });
        }

        await dbManager.incrementPlayerWins(gameId, userId);
        return reply.status(200).send({ success: true, message: `Player ${userId}'s wins incremented for game ${gameId}` });
    } catch (error) {
        console.error('Error incrementing player wins:', error);
        return reply.status(500).send({ error: 'Failed to increment player wins' });
    }
});

app.post('/api/games/incrementLosses', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { gameId, userId } = request.body as { gameId: number; userId: number };

        if (!gameId || !userId) {
            return reply.status(400).send({ error: 'gameId and userId are required' });
        }

        await dbManager.incrementPlayerLosses(gameId, userId);
        return reply.status(200).send({ success: true, message: `Player ${userId}'s losses incremented for game ${gameId}` });
    } catch (error) {
        console.error('Error incrementing player losses:', error);
        return reply.status(500).send({ error: 'Failed to increment player losses' });
    }
});

app.get('/api/games/:gameId/rankings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { gameId } = request.params as { gameId: string };

        if (!gameId) {
            return reply.status(400).send({ error: 'gameId is required' });
        }

        const rankings = await dbManager.getUserRankingsByGame(Number(gameId));
        return reply.status(200).send(rankings);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        return reply.status(500).send({ error: 'Failed to fetch rankings' });
    }
});


///////////////////
// SOCKET ROUTES //
///////////////////


////////////////////////////////////////////////
//                Matchmaking                 //
////////////////////////////////////////////////

const gameNs = app.io.of('/game');
setupGameMatchmaking(gameNs);

// Route pour récupérer le nom d'hôte
app.get('/api/hostname', async (request: FastifyRequest, reply: FastifyReply) => {
    return { hostname: process.env.HOSTNAME || 'localhost' };
});

app.post('/api/match/addToHistory', { preHandler: authMiddleware }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
        const { user1Id, user2Id, user1Lives, user2Lives } = request.body as {
            user1Id: string | number;
            user2Id: string | number;
            user1Lives: number;
            user2Lives: number;
        };

        if (!user1Id || !user2Id || user1Lives === undefined || user2Lives === undefined) {
            return reply.status(400).send({ error: 'Missing required fields' });
        }

        // Vérification si les IDs sont des socket_id ou des ID utilisateur valides
        let validUser1Id = user1Id;
        let validUser2Id = user2Id;

        // Fonction pour vérifier si c'est un socket_id (format spécial avec caractères non numériques)
        const isSocketId = (id: string | number): boolean => {
            return typeof id === 'string' && (id.includes('_') || id.includes('-') || id.length > 10);
        };

        // Fonction pour obtenir un utilisateur par son ID
        const isValidUserId = async (id: string | number): Promise<boolean> => {
            try {
                // Convertir en nombre si c'est une chaîne numérique
                const numericId = typeof id === 'string' ? parseInt(id) : id;
                if (isNaN(numericId)) return false;
                
                // Vérifier si l'utilisateur existe
                const user = await dbManager.getUserById(numericId);
                return !!user;
            } catch (error) {
                console.error(`Error checking user ID validity for ${id}:`, error);
                return false;
            }
        };

        // Vérifier user1Id
        if (isSocketId(user1Id)) {
            console.warn(`user1Id semble être un socket_id: ${user1Id}`);
            // Pour user1Id, on peut utiliser l'ID de l'utilisateur authentifié
            const authUser = request.user as { id: number };
            if (authUser && authUser.id) {
                validUser1Id = authUser.id;
                console.log(`Remplacé user1Id par l'ID de l'utilisateur authentifié: ${validUser1Id}`);
            } else {
                return reply.status(400).send({ error: 'Invalid user1Id and no authenticated user found' });
            }
        } else if (!(await isValidUserId(user1Id))) {
            return reply.status(400).send({ error: `user1Id ${user1Id} is not a valid user ID` });
        }

        // Vérifier user2Id
        if (isSocketId(user2Id)) {
            console.warn(`user2Id semble être un socket_id: ${user2Id}`);
            // Pour user2Id on n'a pas d'alternative automatique, on rejette la requête
            return reply.status(400).send({ error: 'user2Id appears to be a socket_id, not a valid user ID' });
        } else if (!(await isValidUserId(user2Id))) {
            return reply.status(400).send({ error: `user2Id ${user2Id} is not a valid user ID` });
        }

        // Conversion en nombre pour la base de données
        const finalUser1Id = typeof validUser1Id === 'string' ? parseInt(validUser1Id) : validUser1Id;
        const finalUser2Id = typeof validUser2Id === 'string' ? parseInt(validUser2Id) : validUser2Id;

        // Vérifier que les deux IDs sont des nombres valides
        if (isNaN(finalUser1Id) || isNaN(finalUser2Id)) {
            return reply.status(400).send({ error: 'User IDs must be valid numbers after conversion' });
        }

        console.log(`Ajout d'un match à l'historique: user1Id=${finalUser1Id}, user2Id=${finalUser2Id}, lives: ${user1Lives}-${user2Lives}`);
        await dbManager.addMatchToHistory(finalUser1Id, finalUser2Id, user1Lives, user2Lives);
        return reply.status(200).send({ success: true, message: 'Match added to history' });
    } catch (error) {
        console.error('Error adding match to history:', error);
        return reply.status(500).send({ error: 'Failed to add match to history' });
    }
});

// Nouvel endpoint pour récupérer l'historique des matchs d'un utilisateur
app.get('/api/match/history/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { userId } = request.params as { userId: string };
        
        if (!userId) {
            return reply.status(400).send({ error: 'userId is required' });
        }

        // Récupérer l'historique des matchs depuis la base de données
        const matchHistory = await dbManager.getMatchHistoryForUser(Number(userId));
        
        // Pour chaque match, récupérer les noms des utilisateurs
        const matchesWithNames = await Promise.all(matchHistory.map(async match => {
            const user1 = await dbManager.getUserById(match.user1_id);
            const user2 = await dbManager.getUserById(match.user2_id);
            
            return {
                ...match,
                user1Name: user1 ? user1.username : `User #${match.user1_id}`,
                user2Name: user2 ? user2.username : `User #${match.user2_id}`
            };
        }));

        return reply.status(200).send({ 
            success: true, 
            matches: matchesWithNames 
        });
    } catch (error) {
        console.error('Error fetching match history:', error);
        return reply.status(500).send({ error: 'Failed to fetch match history' });
    }
});
////////////////////////////////////////////
//              SERVER START              //
////////////////////////////////////////////

export const userSocketMap = new Map<string, string>();

const start = async () => {
    try 
    {
        console.log("HOSTNAME", HOSTNAME);
        await dbManager.initialize();
        
        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Fastify server + Socket.IO OK sur port 3000');

        ////////////////////////////////
        //    NOTIFICATION SOCKET     //
        ////////////////////////////////
        const notificationNs = app.io.of('/notification');


        notificationNs.on('connection', (socket: Socket) => {

            console.log("Notification namespace connected:", socket.id);

            socket.on('disconnect', () => {
                console.log('Client disconnected in notification namespace:', socket.id);
                for (const [username, id] of userSocketMap.entries())
                {
                    if (id === socket.id)
                    {
                        userSocketMap.delete(username);
                        console.log('User [', username, '] removed from userSocketMap, socketID [', socket.id, ']');
                        break;
                    }
                }
            });

            socket.on('register', (data) => {
                console.log("Register event received in notification namespace:", data);
                userSocketMap.set(data.username, socket.id);
                console.log("notification namespace userSocketMap:", JSON.stringify(Array.from(userSocketMap.entries())));
            });
        });
        ////////////////////////////////
        //         CHAT SOCKET        //
        ////////////////////////////////
        const chatNs = app.io.of('/chat');
        chatNs.on('connection', (socket: Socket) => {
                socket.on('register', (data) => {
        userSocketMap.set(data.username, socket.id);
        console.log("chat namespace userSocketMap:", JSON.stringify(Array.from(userSocketMap.entries())));
    });

            socket.on('sendPrivateMessage', async (data, callback) => {
                try {
                    const {to, author, content } = data;
                    await dbManager.saveMessage(data.author, data.content);
                    const targetSocketid = userSocketMap.get(to);
                    if (targetSocketid) {
                        chatNs.to(targetSocketid).emit('receivePrivateMessage', {author, content });
                        if (callback) callback({ success: true });
                    } else {
                        if (callback) callback({ success: false, error: 'User not connected' });
                    }
                } catch (error) {
                    if (callback) {
                        callback({ success: false, error: 'Failed to send private message' });
                    }
                }
            });

            socket.on('sendMessage', async (data, callback) => {
                try 
                {
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
        /////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////
    } catch (err) {
        console.error('Error while starting the server:', err);
        process.exit(1);
    }
};

start();

