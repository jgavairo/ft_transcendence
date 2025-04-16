"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database/database");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_1 = require("./routes/user");
const authentification_1 = require("./routes/authentification");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
exports.JWT_SECRET = process.env.JWT_SECRET || '6d239a75c7b0219b01411336aec34a4c10e9ff3e43d5382100eba4268c5bfa0572e90558e5367cb169de6d43a2e8542cd3643a5d0494c8ac192566a40e86d44c';
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)({
    origin: 'http://127.0.0.1:8080', // Accepte toutes les origines en développement
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
////////////////////////////////////////////
//           List of routes               //
////////////////////////////////////////////
//auth routes
app.get("/api/auth/check", authentification_1.authRoutes.checkAuth);
app.post('/api/auth/register', authentification_1.authRoutes.register);
app.post('/api/auth/login', authentification_1.authRoutes.login);
app.get("/api/auth/logout", authentification_1.authRoutes.logout);
//user routes
app.get('/api/header', user_1.userRoutes.getInfos);
app.get('/api/getLibrary', user_1.userRoutes.getUserLibrary);
app.post('/api/addGame', user_1.userRoutes.addGame);
////////////////////////////////////////////////
//                Matchmaking                 //
////////////////////////////////////////////////
//Création du serveur HTTP et intégration de Socket.IO
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://127.0.0.1:8080',
        methods: ["GET", "POST"],
        credentials: true
    }
});
// File d'attente des joueurs pour le matchmaking
let matchmakingQueue = [];
// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on("joinQueue", (playerData) => {
        console.log(`Player ${socket.id} joined matchmaking.`, playerData);
        matchmakingQueue.push({ id: socket.id, username: playerData.username });
        attemptMatch();
    });
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        matchmakingQueue = matchmakingQueue.filter(player => player.id !== socket.id);
    });
});
//connecter deux joueurs
function attemptMatch() {
    if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();
        if (player1 && player2) {
            console.log(`Match found: ${player1.id} vs ${player2.id}`);
            io.to(player1.id).emit("matchFound", { opponent: player2 });
            io.to(player2.id).emit("matchFound", { opponent: player1 });
        }
    }
}
////////////////////////////////////////////////
//           Start of the server              //
////////////////////////////////////////////////
server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.dbManager.initialize();
    }
    catch (error) {
        console.error('Error while initializing the database:', error);
    }
    console.log(`Server is running on port ${port}`);
}));
