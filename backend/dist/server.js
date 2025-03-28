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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./database/database");
const app = (0, express_1.default)();
const port = 3000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
////////////////////////////////////////////////
//           Start of the server              //
////////////////////////////////////////////////
app.get("/", (req, res) => {
    res.json({ message: "API ft_transcendence" });
});
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.dbManager.initialize();
    }
    catch (error) {
        console.error('Error while initializing the database:', error);
    }
    console.log(`Server is running on port ${port}`);
}));
////////////////////////////////////////////////
//           List of the routes               //
////////////////////////////////////////////////
app.post("/api/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    console.log('connection tentative -');
    console.log("username: " + username, "password: " + password);
    const user = yield database_1.dbManager.getUserByUsername(username);
    if (!user)
        throw new Error("User not found");
    else {
        if (user.password_hash !== password)
            res.json({
                success: false,
                message: "Invalid password"
            });
        else {
            res.json({
                success: true,
                message: "Login successful",
                user: user.id
            });
        }
    }
    if (username === "admin" && password === "admin") {
        res.json({
            success: true,
            message: "Login successful",
            user: {
                username: username,
                email: username + "@gmail.com"
            }
        });
    }
    else {
        res.json({
            success: false,
            message: "Login failed"
        });
    }
}));
app.post('/api/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Registering user");
    const { username, password, email } = req.body;
    try {
        const userID = yield database_1.dbManager.registerUser({
            username: username,
            email: email,
            password_hash: password
        });
        res.json({
            success: true,
            message: "User registered successfully",
            userID: userID
        });
    }
    catch (error) {
        res.json({
            success: false,
            message: "User registration failed",
            error: error
        });
    }
}));
//npx ts-node src/server.ts
