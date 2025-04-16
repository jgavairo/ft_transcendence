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
exports.authRoutes = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database/database");
const server_1 = require("../server");
const loginHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        console.log('connection tentative -');
        console.log("username: " + username, "password: " + password);
        const user = yield database_1.dbManager.getUserByUsername(username);
        if (!user) {
            res.json({
                success: false,
                message: "User not found"
            });
        }
        else {
            if (user.password_hash !== password) {
                res.json({
                    success: false,
                    message: "Invalid password"
                });
            }
            else {
                const token = jsonwebtoken_1.default.sign({ userId: user.id }, server_1.JWT_SECRET, { expiresIn: '1h' });
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000
                });
                res.json({
                    success: true,
                    message: "Login successful",
                    user: user.id
                });
            }
        }
    }
    catch (error) {
        res.json({
            success: false,
            message: "Login failed"
        });
    }
});
const registerHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Registering user");
    const { username, password, email } = req.body;
    try {
        const userID = yield database_1.dbManager.registerUser({
            username: username,
            email: email,
            password_hash: password,
            profile_picture: '../assets/profile_pictures/default.png',
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
});
const checkAuthHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.json({
                success: false,
                message: "User non authenified"
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, server_1.JWT_SECRET);
        res.json({
            success: true,
            message: "User authenified"
        });
    }
    catch (error) {
        res.json({
            success: false,
            message: "Invalid token"
        });
    }
});
const logoutHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });
    res.json({
        success: true,
        message: "User logged out"
    });
});
exports.authRoutes = {
    login: loginHandler,
    register: registerHandler,
    checkAuth: checkAuthHandler,
    logout: logoutHandler
};
