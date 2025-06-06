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
import { newsRoutes } from './routes/news.js';
import { hasPlayedHandler } from './routes/game.js';
export const JWT_SECRET = process.env.JWT_SECRET || ''
export const HOSTNAME = process.env.HOSTNAME || 'localhost'
import { Game } from './games/tower/GameState.js';
import { spawnCommand } from './games/tower/types/types.js';
import { GAME_CONFIG } from './games/tower/config.js';

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
    callbackUri: `https://${HOSTNAME}:8443/api/auth/google/callback`,
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

app.post('/api/auth/confirm2FA', async (request: FastifyRequest, reply: FastifyReply) => {
    return authRoutes.confirm2FA(request, reply);
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
            return reply.redirect(`https://${HOSTNAME}:8443/login?error=google&message=Erreur API Google`);
        }

        const result = await googleAuthHandler(userInfo);
        console.log("Google auth handler result:", result);

        if (!result.success) {
            const errorMessage = result.message || "Erreur lors de l'authentification Google";
            return reply.redirect(`https://${HOSTNAME}:8443/login?error=google&message=${encodeURIComponent(errorMessage)}`);
        }

        if (!result.token) {
            console.error('No token generated from googleAuthHandler');
            return reply.redirect(`https://${HOSTNAME}:8443/login?error=google&message=Erreur de génération du token`);
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
        return reply.redirect(`https://${HOSTNAME}:8443/`);
    } catch (error) {
        console.error('Error during Google authentication:', error);
        return reply.redirect(`https://${HOSTNAME}:8443/login?error=google&message=Erreur lors de l'authentification`);
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

app.post('/api/user/block', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.blockUser(request, reply);
});

app.post('/api/user/unblock', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.unblockUser(request, reply);
});

app.post('/api/user/isBlocked', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.isBlocked(request, reply);
});

app.post('/api/user/changeUsername', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.changeUsername(request, reply);
});

app.post('/api/user/changeEmail', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.changeEmail(request, reply);
});

app.get('/api/user/send2FACode', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.send2FACode(request, reply);
});

app.post('/api/user/enable2FA', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.enable2FA(request, reply);
});

app.post('/api/user/disable2FA', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.disable2FA(request, reply);
});

app.get('/api/user/isGoogleUser', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return userRoutes.isGoogleUser(request, reply);
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

////////////////
// NEWS ROUTES //
////////////////

app.get('/api/news/getAll', async (request: FastifyRequest, reply: FastifyReply) => {
    return newsRoutes.getAllNews(request, reply);
});

/////////////////
// GAME ROUTES //
/////////////////

app.get('/api/games/getAll', async (request: FastifyRequest, reply: FastifyReply) => {
    return gameRoutes.getAllGames(request, reply);
});

app.get('/api/pong/room-exists', async (request: FastifyRequest, reply: FastifyReply) => {
    return gameRoutes.roomExists(request, reply);
});

app.get<{
    Params: { gameId: string; mode: string }
  }>(
    '/api/games/:gameId/:mode/hasPlayed',
    { preHandler: authMiddleware },
    hasPlayedHandler
  );

app.post<{
    Body: { gameId: number; mode: number }
  }>(
    '/api/games/isFirstGame',
    {
      schema: {
        body: {
          type: 'object',
          required: ['gameId','mode'],
          properties: {
            gameId: { type: 'integer' },
            mode:   { type: 'integer', minimum: 0, maximum: 3 }
          }
        }
      }
    },
    gameRoutes.isFirstGame   // ← pas de wrapper, Fastify voit direct le bon type
  );

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
        const { user1Id, user2Id, gameId, user1Lives, user2Lives } = request.body as {
            user1Id: string | number;
            user2Id: string | number;
            gameId: number;
            user1Lives: number;
            user2Lives: number;
        };

        if (!user1Id || !user2Id || gameId === undefined || user1Lives === undefined || user2Lives === undefined) {
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

        console.log(`Ajout d'un match à l'historique: user1Id=${finalUser1Id}, user2Id=${finalUser2Id}, gameId=${gameId}, lives: ${user1Lives}-${user2Lives}`);
        await dbManager.addMatchToHistory(finalUser1Id, finalUser2Id, gameId, user1Lives, user2Lives);
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
        const gameId = request.query && (request.query as any).gameId ? Number((request.query as any).gameId) : undefined;
        if (!userId) {
            return reply.status(400).send({ error: 'userId is required' });
        }
        // Récupérer l'historique des matchs depuis la base de données
        const matchHistory = await dbManager.getMatchHistoryForUser(Number(userId), gameId);
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
export const userSocketMapChat = new Map<string, string>();
export const userSocketMapTower = new Map<string, string>();

const start = async () => {
    try 
    {
        console.log("HOSTNAME", HOSTNAME);
        await dbManager.initialize();

        await app.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Fastify server + Socket.IO OK sur port 3000');

        ////////////////////////////////
        //         CHAT SOCKET        //
        ////////////////////////////////
        const chatNs = app.io.of('/chat');
        chatNs.on('connection', (socket: Socket) => {
            socket.on('register', (data) => {
                // data doit contenir userId et username
                if (data.userId !== undefined) {
                    userSocketMapChat.set(String(data.userId), socket.id);
                }
                // Pour compatibilité, on garde aussi l'ancien mapping si besoin
                if (data.username) {
                    userSocketMapChat.set(data.username, socket.id);
                }
                console.log("chat namespace userSocketMap:", JSON.stringify(Array.from(userSocketMapChat.entries())));
            });

            socket.on('sendPrivateMessage', async (data, callback) => {
                try {
                    const {to, author, content } = data;
                    // author est maintenant un id utilisateur (number)
                    await dbManager.saveMessage(author, content);
                    const targetSocketid = userSocketMapChat.get(String(to));
                    const authorSocketid = userSocketMapChat.get(String(author));
                    // Récupérer les infos de l'auteur pour enrichir le message
                    let authorUser = null;
                    try {
                        authorUser = await dbManager.getUserById(Number(author));
                    } catch {}
                    const authorInfo = authorUser ? {
                        id: authorUser.id,
                        username: authorUser.username,
                        profile_picture: authorUser.profile_picture
                    } : { id: author, username: `User#${author}`, profile_picture: null };
                    if (targetSocketid) {
                        chatNs.to(targetSocketid).emit('receivePrivateMessage', {author: authorInfo.id, content, authorInfo });
                    }
                    // (Suppression de l'envoi au sender)
                    // if (authorSocketid) {
                    //     chatNs.to(authorSocketid).emit('receivePrivateMessage', {author: authorInfo.id, content, authorInfo });
                    // }
                    if (callback) callback({ success: true });
                } catch (error) {
                    if (callback) {
                        callback({ success: false, error: 'Failed to send private message' });
                    }
                }
            });

            socket.on('sendMessage', async (data, callback) => {
                try 
                {
                    // author est maintenant un id utilisateur (number)
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
        /////////////////////////////////////////////////////////////////////////
    
        //////////////////////////////
        //        TOWER SOCKET      //
        //////////////////////////////

        const towerGames = new Map<string, Game>();
        const towerQueue: Array<{id: string, username: string}> = [];
        const towerNs = app.io.of('/tower');

        towerNs.on('connection', (socket: Socket) => 
        {
            console.log("Tower namespace connected:", socket.id);

            socket.on('register', (username: string) => {
                console.log("XXX Register event received in tower namespace:", username, "with socket.id:", socket.id);
                userSocketMapTower.set(socket.id, username);
            });
            
            socket.on('joinQueue', (username: string) =>
            {
                // Vérifier si le joueur est déjà dans la queue avec un socket actif
                const alreadyInQueue = towerQueue.some(player => 
                    player.username === username && 
                    towerNs.sockets.has(player.id)
                );
                if (alreadyInQueue) {
                    socket.emit('error', { message: 'Vous êtes déjà dans la file d\'attente' });
                    return;
                }

                // Nettoyer les entrées de queue invalides pour ce joueur
                const index = towerQueue.findIndex(player => 
                    player.username === username && 
                    !towerNs.sockets.has(player.id)
                );
                if (index !== -1) {
                    towerQueue.splice(index, 1);
                }

                // Vérifier si le joueur est déjà dans une partie en cours
                const existingGame = Array.from(towerGames.entries()).find(([_, game]) => {
                    const state = game.getState();
                    return state.player.username === username || state.enemy.username === username;
                });

                if (existingGame) {
                    socket.emit('error', { message: 'Vous êtes déjà dans une partie en cours' });
                    return;
                }

                towerQueue.push({id: socket.id, username: username});
                attemptMatch();
            });

            socket.on('leaveQueue', () => {
                const index = towerQueue.findIndex(player => player.id === socket.id);
                if (index !== -1) {
                    towerQueue.splice(index, 1);
                }
            });

            socket.on('playSolo', (username: string) => {
                const game = new Game(socket.id, socket.id, false);
                towerGames.set(socket.id, game);
            });

            function attemptMatch() 
            {
                while (towerQueue.length >= 2) {
                    const [player1, player2] = towerQueue.splice(0, 2);
                    const game = new Game(player1.id, player2.id, true);
                    const roomId = `tower_${Date.now()}`;
                    
                    towerGames.set(roomId, game);
                    
                    towerNs.to(player1.id).emit('matchFound', {
                        roomId,
                        side: 'player',
                        opponent: player2.username
                    });
                    towerNs.to(player2.id).emit('matchFound', {
                        roomId,
                        side: 'enemy',
                        opponent: player1.username
                    });
                }
            }

            const gameLoop = setInterval(() => 
            {
                // Vérifier d'abord le jeu solo
                const soloGame = towerGames.get(socket.id);
                if (soloGame)
                {
                    soloGame.update();
                    socket.emit('gameState', soloGame.getState());
                }

                // Vérifier les jeux multijoueur
                for (const [roomId, game] of towerGames.entries()) {
                    if (roomId.startsWith('tower_')) {
                        game.update();
                        towerNs.to(roomId).emit('gameState', game.getState());
                        
                        // Si la partie est terminée, nettoyer après un délai
                        if (game.getState().finish && !game.historySaved) {
                            (async () => {
                                try {
                                    const playerUsername = game.getState().player.username;
                                    const enemyUsername = game.getState().enemy.username;
                                    const player = await dbManager.getUserByUsername(playerUsername);
                                    const enemy = await dbManager.getUserByUsername(enemyUsername);
                                    if (player && player.id !== undefined && enemy && enemy.id !== undefined) {
                                        // Récupérer l'id du jeu Tower (par défaut 3, à adapter si besoin)
                                        const towerGame = await dbManager.getAllGames();
                                        const tower = towerGame.find(g => g.name.toLowerCase() === 'tower');
                                        const towerGameId = tower ? tower.id : 3;
                                        // HP restants = score sur 100 pour Tower, borné à [0,100] et arrondi à l'entier le plus proche
                                        const playerRaw = game.getState().player.tower;
                                        const enemyRaw = game.getState().enemy.tower;
                                        const playerScore = Math.max(0, Math.min(100, Math.round((playerRaw / 500) * 100)));
                                        const enemyScore = Math.max(0, Math.min(100, Math.round((enemyRaw / 500) * 100)));
                                        await dbManager.addMatchToHistory(player.id, enemy.id, towerGameId, playerScore, enemyScore);
                                        console.log(`[Tower] Match history saved for ${player.username} vs ${enemy.username} (score: ${playerScore}-${enemyScore}, game_id: ${towerGameId})`);
                                        // Ajout victoires/défaites Tower multi
                                        if (game.getState().winner === playerUsername) {
                                            await dbManager.incrementPlayerWins(towerGameId, player.id);
                                            await dbManager.incrementPlayerLosses(towerGameId, enemy.id);
                                        } else if (game.getState().winner === enemyUsername) {
                                            await dbManager.incrementPlayerWins(towerGameId, enemy.id);
                                            await dbManager.incrementPlayerLosses(towerGameId, player.id);
                                        }
                                    } else {
                                        console.warn('[Tower] Could not find user IDs for match history:', playerUsername, enemyUsername);
                                    }
                                } catch (err) {
                                    console.error('[Tower] Error saving match history:', err);
                                }
                                game.historySaved = true;
                                    
                                towerGames.delete(roomId);
                                console.log(`[Tower] Game ${roomId} cleaned up after completion`);

                            })();
                        }
                    }
                }
            }, 1000 / GAME_CONFIG.TICK_RATE);

            socket.on('command', (command: spawnCommand) =>
            {
                // Vérifier d'abord le jeu solo
                const soloGame = towerGames.get(socket.id);
                if (soloGame && command.type === 'spawn')
                {
                    soloGame.spawnUnit('player', command.troopType);
                    return;
                }

                // Chercher le jeu multijoueur du joueur
                for (const [roomId, game] of towerGames.entries())
                {
                    if (roomId.startsWith('tower_')) 
                    {
                        const isPlayerOne = game.getSocketPlayerOne() === socket.id;
                        const isPlayerTwo = game.getSocketPlayerTwo() === socket.id;
                        
                        if (isPlayerOne || isPlayerTwo) 
                        {
                            if (command.type === 'spawn')
                            {
                                const side = isPlayerOne ? 'player' : 'enemy';
                                const unitscount = game.getState()[side].units.length;
                                if (unitscount < 8)
                                    game.spawnUnit(side, command.troopType);
                            }
                            break;
                        }
                    }
                }
            });

            socket.on('ready', (roomId: string) => {
                console.log("Player ready in room:", roomId);
                const game = towerGames.get(roomId);
                if (game) {
                    socket.join(roomId);
                    game.update();
                    towerNs.to(roomId).emit('gameState', game.getState());
                }
            });

            socket.on('quitMatch', (roomId: string, username : string) => {
                console.log(username + " leave a match, he has forfaited");
                const game = towerGames.get(roomId);
                console.log("Game:", game);
                if (game) 
                {
                    console.log("Killing player:", username);
                    game.killPlayer(username);
                }
            });
            
            socket.on('disconnect', () =>
            {
                clearInterval(gameLoop);
                // Ne supprimer que la partie solo si elle existe
                if (towerGames.has(socket.id)) {
                    towerGames.delete(socket.id);
                }
                console.log('Client déconnecté du namespace /tower:', socket.id);
            });
        });
    } 
    catch (err) 
    {
        console.error('Error while starting the server:', err);
        process.exit(1);
    }
};

start();
