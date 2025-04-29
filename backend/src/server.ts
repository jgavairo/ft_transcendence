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
import { startMatch, MatchState } from "./games/pong/gameSimulation.js";
import { startTriMatch, updateTriMatch, TriMatchState } from './games/pong/TripongSimulation.js';
import fs from 'fs';
import { authMiddleware } from './middleware/auth.js';
import { chatRoutes } from './routes/chat.js';
import { gameRoutes } from './routes/game.js';
import fastifyMultipart from '@fastify/multipart';
import fastifyOauth2 from '@fastify/oauth2';
import type { FastifyPluginAsync } from 'fastify';

export const JWT_SECRET = process.env.JWT_SECRET || ''
export const HOSTNAME = process.env.HOSTNAME || 'localhost'

// Créer l'application Fastify
const app = fastify({
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

// --- Types partagés ---
interface PlayerInfo {
  side: number;               // 0=player1/left, 1=player2/right (ou 2 pour tri)
  mode: 'solo' | 'multi' | 'tri';
}
const playerInfo = new Map<string, PlayerInfo>();

interface Player { id: string; username: string; }

// --- Files d'attente & états de match ---
let matchmakingQueue: Player[] = [];
const matchStates = new Map<string, MatchState>();

let triQueue: Player[] = [];
const triMatchStates = new Map<string, TriMatchState>();

// === Lorsqu'un client se connecte ===
gameNs.on('connection', (socket: Socket) => {
  // --- SOLO (1 joueur local) ---
  socket.on('startSolo', ({ username }: { username: string }) => {
    const match = startMatch(socket, socket, gameNs);
    matchStates.set(match.roomId, match);
    playerInfo.set(socket.id, { side: 0, mode: 'solo' });
    socket.emit('matchFound', { roomId: match.roomId, side: 0, mode: 'solo' });
  });

  // --- CLASSIC 2 JOUEURS ---
  socket.on('joinQueue', ({ username }: { username: string }) => {
    matchmakingQueue.push({ id: socket.id, username });
    attemptClassicMatch();
  });

  socket.on('movePaddle', (data: { paddle: 0|1; direction: 'up'|'down'|null }) => {
    const info = playerInfo.get(socket.id);
    if (!info || info.mode !== 'multi') return;
    if (info.side !== data.paddle) return;  // on pilote que son côté
    const roomId = [...socket.rooms].find(r => r !== socket.id);
    if (!roomId) return;
    const match = matchStates.get(roomId);
    if (!match) return;
    if (data.paddle === 0) match.leftPaddleDirection  = data.direction;
    else                  match.rightPaddleDirection = data.direction;
  });

  // --- TRI-PONG 3 JOUEURS ---
  socket.on('joinTriQueue', ({ username }: { username: string }) => {
    triQueue.push({ id: socket.id, username });
    attemptTriMatch();
  });

  socket.on('movePaddleTri', ({ direction }: { direction: 'up'|'down'|null }) => {
    const info = playerInfo.get(socket.id);
    if (!info || info.mode !== 'tri') return;
    const roomId = [...socket.rooms].find(r => r !== socket.id);
    if (!roomId) return;
    const match = triMatchStates.get(roomId);
    if (!match) return;
    match.paddles[info.side].direction = direction;
  });

  // --- Nettoyage à la déconnexion ---
  socket.on('disconnect', () => {
    playerInfo.delete(socket.id);
    matchmakingQueue = matchmakingQueue.filter(p => p.id !== socket.id);
    triQueue         = triQueue.filter(p => p.id !== socket.id);
  });
});

// === Fonctions de mise en relation ===

// 2-joueurs classique
function attemptClassicMatch() {
  while (matchmakingQueue.length >= 2) {
    const p1 = matchmakingQueue.shift()!;
    const p2 = matchmakingQueue.shift()!;
    const s1 = gameNs.sockets.get(p1.id)!;
    const s2 = gameNs.sockets.get(p2.id)!;

    const match = startMatch(s1, s2, gameNs);
    matchStates.set(match.roomId, match);

    playerInfo.set(p1.id, { side: 0, mode: 'multi' });
    playerInfo.set(p2.id, { side: 1, mode: 'multi' });

    s1.join(match.roomId);
    s2.join(match.roomId);
    s1.emit('matchFound', { roomId: match.roomId, side: 0, mode: 'multi' });
    s2.emit('matchFound', { roomId: match.roomId, side: 1, mode: 'multi' });
  }
}

// 3-joueurs Tri-Pong
function attemptTriMatch() {
  while (triQueue.length >= 3) {
    const trio = triQueue.splice(0, 3);
    const socks = trio
      .map(p => gameNs.sockets.get(p.id))
      .filter((s): s is Socket => !!s);

    const match = startTriMatch(socks, gameNs);
    triMatchStates.set(match.roomId, match);

    socks.forEach((s, i) => {
      playerInfo.set(s.id, { side: i, mode: 'tri' });
      s.join(match.roomId);
      s.emit('matchFoundTri', { roomId: match.roomId, side: i });
    });

    // boucle serveur 60 FPS
    const tick = setInterval(() => {
      const m = triMatchStates.get(match.roomId);
      if (!m) return clearInterval(tick);
      updateTriMatch(m);
      gameNs.to(match.roomId).emit('stateUpdateTri', m);
      if (m.gameOver) clearInterval(tick);
    }, 1000/60);
  }
}

// Route pour récupérer le nom d'hôte
app.get('/api/hostname', async (request: FastifyRequest, reply: FastifyReply) => {
    return { hostname: process.env.HOSTNAME || 'localhost' };
});

////////////////////////////////////////////
//              SERVER START              //
////////////////////////////////////////////

const start = async () => {
    try {
        console.log("HOSTNAME", HOSTNAME);
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

/////////////////
// VICTORY ROUTES //
/////////////////

// Route pour récupérer le nombre de victoires d'un utilisateur pour un jeu donné
app.get('/api/victories/:userId/:gameId', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, gameId } = request.params as { userId: string, gameId: string };
    try {
        const victories = await dbManager.getVictories(parseInt(userId), parseInt(gameId));
        return reply.send({ victories });
    } catch (error) {
        console.error('Error fetching victories:', error);
        return reply.status(500).send({ error: 'Failed to fetch victories' });
    }
});

// Route pour ajouter une victoire pour un utilisateur et un jeu donné
app.post('/api/victories/add', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, gameId } = request.body as { userId: number, gameId: number };
    try {
        await dbManager.addVictory(userId, gameId);
        return reply.send({ success: true });
    } catch (error) {
        console.error('Error adding victory:', error);
        return reply.status(500).send({ error: 'Failed to add victory' });
    }
});

// Route pour récupérer le classement des utilisateurs pour un jeu donné
app.get('/api/leaderboard/:gameId', { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { gameId } = request.params as { gameId: string };
    try {
        const leaderboard = await dbManager.getLeaderboard(parseInt(gameId));
        return reply.send({ leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return reply.status(500).send({ error: 'Failed to fetch leaderboard' });
    }
});
