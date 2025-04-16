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
exports.dbManager = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DatabaseManager {
    constructor() {
        this.db = null;
    }
    ;
    static getInstance() {
        if (!DatabaseManager.instance)
            DatabaseManager.instance = new DatabaseManager();
        return DatabaseManager.instance;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db)
                return;
            try {
                this.db = yield (0, sqlite_1.open)({
                    filename: '/app/data/database.db',
                    driver: sqlite3_1.default.Database
                });
                const schema = fs_1.default.readFileSync(path_1.default.join(__dirname, 'schema.sql'), 'utf8');
                yield this.db.exec(schema);
                console.log('database initialized successfully');
            }
            catch (error) {
                console.error('Erreur lors de l\'initialisation de la base de données:', error);
                throw error;
            }
        });
    }
    registerUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error('Database not initialized');
            const result = yield this.db.run('INSERT INTO users (username, email, password_hash, profile_picture, library) VALUES (?, ?, ?, ?, ?)', [user.username, user.email, user.password_hash, user.profile_picture, JSON.stringify([])]);
            if (!result.lastID)
                throw new Error('Failed to create new user');
            return result.lastID;
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error('Database not initialized');
            const result = yield this.db.get('SELECT * FROM users WHERE username = ?', [username]);
            return result;
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error('Database not initialized');
            const result = yield this.db.get('SELECT * FROM users WHERE id = ?', [id]);
            return result;
        });
    }
    getUserLibrary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error('Database not initialized');
            const result = yield this.db.get('SELECT library FROM users WHERE id = ?', [userId]);
            console.log("Raw library result:", result);
            if (!result || !(result === null || result === void 0 ? void 0 : result.library)) {
                yield this.db.run('UPDATE users SET library = ? WHERE id = ?', [JSON.stringify([]), userId]);
                return [];
            }
            try {
                const libraryStr = result.library.startsWith('"') ?
                    result.library.slice(1, -1) : result.library;
                console.log("Library string to parse:", libraryStr);
                return JSON.parse(libraryStr); // Reconvertir en tableau
            }
            catch (error) {
                console.error('Erreur lors de la conversion:', error);
                return [];
            }
        });
    }
    addGameToLibrary(userId, gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db)
                throw new Error('Database not initialized');
            const library = yield this.getUserLibrary(userId);
            console.log("Library before adding game:", library);
            if (!library.includes(gameId)) { // Éviter les doublons
                library.push(gameId);
                console.log("Library after adding game:", library);
                // Ajouter cette ligne pour sauvegarder dans la base de données
                yield this.db.run('UPDATE users SET library = ? WHERE id = ?', [JSON.stringify(library), userId]);
            }
        });
    }
}
exports.dbManager = DatabaseManager.getInstance();
