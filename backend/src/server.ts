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
import fastifyStatic from '@fastify/static';
import path from 'path';
export const JWT_SECRET = process.env.JWT_SECRET || ''
export const HOSTNAME = process.env.HOSTNAME || 'localhost'
import { Game } from './games/tower/GameState.js';
import { spawnCommand } from './games/tower/types/types.js';
import { GAME_CONFIG } from './games/tower/config.js';

// Créer l'application Fastify
export const app = fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
    https: {
        key: fs.readFileSync('/app/ssl/privkey.pem'),
        cert: fs.readFileSync('/app/ssl/fullchain.pem')
    }
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

// Servir les fichiers statiques (images uploadées) de manière sécurisée
app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    setHeaders: (res, path, stat) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
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
            const errorHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Erreur d'authentification</title>
                </head>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_AUTH_ERROR',
                                message: 'Erreur API Google'
                            }, 'https://${HOSTNAME}:8443');
                        }
                    </script>
                    <p>Erreur lors de l'authentification Google. Cette fenêtre se fermera automatiquement.</p>
                </body>
                </html>
            `;
            return reply.type('text/html').send(errorHtml);
        }

        const result = await googleAuthHandler(userInfo);
        console.log("Google auth handler result:", result);

        if (!result.success) {
            const errorMessage = result.message || "Erreur lors de l'authentification Google";
            const errorHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Erreur d'authentification</title>
                </head>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_AUTH_ERROR',
                                message: '${errorMessage}'
                            }, 'https://${HOSTNAME}:8443');
                        }
                    </script>
                    <p>Erreur: ${errorMessage}. Cette fenêtre se fermera automatiquement.</p>
                </body>
                </html>
            `;
            return reply.type('text/html').send(errorHtml);
        }

        if (!result.token) {
            console.error('No token generated from googleAuthHandler');
            const errorHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Erreur d'authentification</title>
                </head>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_AUTH_ERROR',
                                message: 'Erreur de génération du token'
                            }, 'https://${HOSTNAME}:8443');
                        }
                    </script>
                    <p>Erreur de génération du token. Cette fenêtre se fermera automatiquement.</p>
                </body>
                </html>
            `;
            return reply.type('text/html').send(errorHtml);
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

        // Retourner une page HTML qui communique avec la popup parent
        const successHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentification réussie</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 50px;
                        background-color: #f0f0f0;
                    }
                    .success-message {
                        background-color: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                        padding: 20px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="success-message">
                    <h2>Authentification réussie !</h2>
                    <p>Vous allez être redirigé automatiquement...</p>
                </div>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_AUTH_SUCCESS'
                        }, 'https://${HOSTNAME}:8443');
                        
                        // Fermer la popup après un court délai
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    } else {
                        // Si pas de popup parent, rediriger normalement
                        window.location.href = 'https://${HOSTNAME}:8443/';
                    }
                </script>
            </body>
            </html>
        `;
        
        return reply.type('text/html').send(successHtml);
    } catch (error) {
        console.error('Error during Google authentication:', error);
        const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Erreur d'authentification</title>
            </head>
            <body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'GOOGLE_AUTH_ERROR',
                            message: 'Erreur lors de l\'authentification'
                        }, 'https://${HOSTNAME}:8443');
                    }
                </script>
                <p>Erreur lors de l'authentification. Cette fenêtre se fermera automatiquement.</p>
            </body>
            </html>
        `;
        return reply.type('text/html').send(errorHtml);
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

app.get('/api/news/getAll', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return newsRoutes.getAllNews(request, reply);
});

/////////////////
// GAME ROUTES //
/////////////////

app.get('/api/games/getAll', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    return gameRoutes.getAllGames(request, reply);
});

app.get('/api/pong/room-exists', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
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
      preHandler: authMiddleware,
      schema: {
        body: {
          type: 'object',
          required: ['gameId','mode'],
          properties: {
            gameId: { type: 'integer' },
            mode:   { type: 'integer', minimum: 0, maximum: 3 }
          }
        }
      },
    },
    gameRoutes.isFirstGame   // ← pas de wrapper, Fastify voit direct le bon type
  );

//////////////////
// STATS ROUTES //
//////////////////

app.get('/api/games/:gameId/rankings', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
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
setupGameMatchmaking(gameNs, app.io); // <-- passe app.io ici

// Route pour récupérer le nom d'hôte
app.get('/api/hostname', async (request: FastifyRequest, reply: FastifyReply) => {
    return { hostname: process.env.HOSTNAME || 'localhost' };
});

// Nouvel endpoint pour récupérer l'historique des matchs d'un utilisateur
app.get('/api/match/history/:userId', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
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
                if (data.userId !== undefined) {
                    userSocketMapChat.set(String(data.userId), socket.id);
                }
                if (data.username) {
                    userSocketMapChat.set(data.username, socket.id);
                }
                console.log("chat namespace userSocketMap:", JSON.stringify(Array.from(userSocketMapChat.entries())));
            });

            socket.on('sendPrivateMessage', async (data, callback) => {
                try {
                    const {to, author, content } = data;
                    if (typeof content !== 'string' || content.length > 250) {
                        if (callback) callback({ success: false, error: 'Message trop long (max 250 caractères)' });
                        return;
                    }
                    await dbManager.saveMessage(author, content);
                    const targetSocketid = userSocketMapChat.get(String(to));
                    const authorSocketid = userSocketMapChat.get(String(author));
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
                    if (typeof data.content !== 'string' || data.content.length > 250) {
                        if (callback) callback({ success: false, error: 'Message too long (max 250 characters)' });
                        return;
                    }
                    await dbManager.saveMessage(data.author, data.content);

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
                console.log("Register event received in tower namespace:", username, "with socket.id:", socket.id);
                userSocketMapTower.set(socket.id, username);
            });
            
            socket.on('joinQueue', (username: string) =>
            {
                const alreadyInQueue = towerQueue.some(player => 
                    player.username === username && 
                    towerNs.sockets.has(player.id)
                );
                if (alreadyInQueue) {
                    socket.emit('error', { message: 'you are already in the queue' });
                    return;
                }

                const index = towerQueue.findIndex(player => 
                    player.username === username && 
                    !towerNs.sockets.has(player.id)
                );
                if (index !== -1) {
                    towerQueue.splice(index, 1);
                }

                const existingGame = Array.from(towerGames.entries()).find(([_, game]) => {
                    const state = game.getState();
                    return state.player.username === username || state.enemy.username === username;
                });

                if (existingGame) {
                    socket.emit('error', { message: 'you are already in a game' });
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
                const soloGame = towerGames.get(socket.id);
                if (soloGame)
                {
                    soloGame.update();
                    socket.emit('gameState', soloGame.getState());
                }

                for (const [roomId, game] of towerGames.entries()) {
                    if (roomId.startsWith('tower_')) {
                        game.update();
                        towerNs.to(roomId).emit('gameState', game.getState());
                        
                        if (game.getState().finish && !game.historySaved) {
                            game.historySaved = true;
                            (async () => {
                                try {
                                    const playerUsername = game.getState().player.username;
                                    const enemyUsername = game.getState().enemy.username;
                                    const player = await dbManager.getUserByUsername(playerUsername);
                                    const enemy = await dbManager.getUserByUsername(enemyUsername);
                                    if (player && player.id !== undefined && enemy && enemy.id !== undefined) {
                                        const games = await dbManager.getAllGames();
                                        const tower = games.find(g => g.name.toLowerCase() === 'tower');
                                        const towerGameId = tower ? tower.id : 3;
                                        // Calcul des points = dégâts infligés à l'ennemi
                                        const playerDamage = GAME_CONFIG.TOWER_HP - game.getState().enemy.tower;
                                        const enemyDamage = GAME_CONFIG.TOWER_HP - game.getState().player.tower;
                                        await dbManager.addMatchToHistory(player.id, enemy.id, towerGameId, playerDamage, enemyDamage);
                                        if (game.getState().winner === playerUsername) {
                                            await dbManager.incrementPlayerWins(towerGameId, player.id);
                                            await dbManager.incrementPlayerLosses(towerGameId, enemy.id);
                                        } else if (game.getState().winner === enemyUsername) {
                                            await dbManager.incrementPlayerWins(towerGameId, enemy.id);
                                            await dbManager.incrementPlayerLosses(towerGameId, player.id);
                                        }
                                        console.log(`[Tower] Match history saved for ${player.username} vs ${enemy.username} (damage: ${playerDamage}-${enemyDamage}, game_id: ${towerGameId})`);
                                    } else {
                                        console.warn('[Tower] Could not find user IDs for match history:', playerUsername, enemyUsername);
                                    }
                                } catch (err) {
                                    console.error('[Tower] Error saving match history:', err);
                                }
                                towerGames.delete(roomId);
                                console.log(`[Tower] Game ${roomId} cleaned up after completion`);
                            })();
                        }
                    }
                }
            }, 1000 / GAME_CONFIG.TICK_RATE);

            socket.on('command', (command: spawnCommand) =>
            {
                const soloGame = towerGames.get(socket.id);
                if (soloGame && command.type === 'spawn')
                {
                    soloGame.spawnUnit('player', command.troopType);
                    return;
                }

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
            
            socket.on('disconnect', () => {
                clearInterval(gameLoop);
                
                const username = userSocketMapTower.get(socket.id);
                if (username) {
                    for (const [roomId, game] of towerGames.entries()) {
                        if (roomId.startsWith('tower_')) {
                            const isPlayerOne = game.getSocketPlayerOne() === socket.id;
                            const isPlayerTwo = game.getSocketPlayerTwo() === socket.id;
                            if (isPlayerOne || isPlayerTwo) {
                                game.killPlayer(username);
                                break;
                            }
                        }
                    }
                }

                if (towerGames.has(socket.id)) {
                    towerGames.delete(socket.id);
                }

                userSocketMapTower.delete(socket.id);
                
                console.log('Client disconnected from /tower namespace:', socket.id);
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
