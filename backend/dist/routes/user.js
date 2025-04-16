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
exports.userRoutes = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database/database");
const server_1 = require("../server");
const getInfosHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.json({
                success: false,
                message: "User non authenified"
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, server_1.JWT_SECRET);
        const user = yield database_1.dbManager.getUserById(decoded.userId);
        if (!user) {
            res.json({
                success: false,
                message: "User not found"
            });
            return;
        }
        else {
            console.log('User complet:', JSON.stringify(user, null, 2));
            res.json({
                success: true,
                message: "User found",
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture
            });
        }
    }
    catch (error) {
        console.error('Erreur détaillée:', error);
        res.json({
            success: false,
            message: "Error while getting user"
        });
    }
});
const getUserLibraryHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        if (!token) {
            console.log("No token");
            res.json({
                success: false,
                message: "User non authenified"
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, server_1.JWT_SECRET);
        const user = yield database_1.dbManager.getUserById(decoded.userId);
        if (!user) {
            console.log("NO USER");
            res.json({
                success: false,
                message: "User not found"
            });
            return;
        }
        else {
            console.log("USER FOUND");
            const userGameLibrary = yield database_1.dbManager.getUserLibrary(decoded.userId);
            console.log('Library before sending:', userGameLibrary);
            res.json({
                success: true,
                message: "User found",
                library: userGameLibrary
            });
        }
    }
    catch (error) {
        console.log("ERROR");
        console.error('Erreur détaillée:', error);
        res.json({
            success: false,
            message: "Error while getting user"
        });
    }
});
const addGameHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("IN ADD GAME HANDLER");
    const { gameId } = req.body;
    try {
        const token = req.cookies.token;
        if (!token) {
            res.json({
                success: false,
                message: "User non authenified"
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, server_1.JWT_SECRET);
        const user = yield database_1.dbManager.getUserById(decoded.userId);
        if (!user) {
            res.json({
                success: false,
                message: "User not found"
            });
            return;
        }
        else {
            console.log("USER FOUND");
            yield database_1.dbManager.addGameToLibrary(decoded.userId, gameId);
            console.log("Game added to library");
            res.json({
                success: true,
                message: "Game added to library"
            });
        }
    }
    catch (error) {
        console.error('Erreur détaillée:', error);
        res.json({
            success: false,
            message: "Error while adding game"
        });
    }
});
exports.userRoutes = {
    getInfos: getInfosHandler,
    getUserLibrary: getUserLibraryHandler,
    addGame: addGameHandler
};
