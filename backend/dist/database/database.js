import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Obtenir l'équivalent de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class DatabaseManager {
    static instance;
    db = null;
    constructor() { }
    ;
    static getInstance() {
        if (!DatabaseManager.instance)
            DatabaseManager.instance = new DatabaseManager();
        return DatabaseManager.instance;
    }
    async initialize() {
        if (this.db)
            return;
        try {
            this.db = await open({
                filename: './data/database.db',
                driver: sqlite3.Database
            });
            const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            await this.db.exec(schema);
            console.log('database initialized successfully');
        }
        catch (error) {
            console.error('Erreur lors de l\'initialisation de la base de données:', error);
            throw error;
        }
    }
    async registerUser(user) {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.run('INSERT INTO users (username, email, password_hash, profile_picture, bio, library) VALUES (?, ?, ?, ?, ?, ?)', [user.username, user.email, user.password_hash, user.profile_picture, '', JSON.stringify([])]);
        if (!result.lastID)
            throw new Error('Failed to create new user');
        return result.lastID;
    }
    async getUserByUsername(username) {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
        return result;
    }
    async getUserById(id) {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
        return result;
    }
    async getUserByEmail(email) {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
        return result;
    }
    async getUserLibrary(userId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get('SELECT library FROM users WHERE id = ?', [userId]);
        console.log("Raw library result:", result);
        if (!result || !result?.library) {
            await this.db.run('UPDATE users SET library = ? WHERE id = ?', [JSON.stringify([]), userId]);
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
    }
    async addGameToLibrary(userId, gameId) {
        if (!this.db)
            throw new Error('Database not initialized');
        const library = await this.getUserLibrary(userId);
        console.log("Library before adding game:", library);
        if (!library.includes(gameId)) { // Éviter les doublons
            library.push(gameId);
            console.log("Library after adding game:", library);
            // Ajouter cette ligne pour sauvegarder dans la base de données
            await this.db.run('UPDATE users SET library = ? WHERE id = ?', [JSON.stringify(library), userId]);
        }
    }
    async changeUserPicture(userId, newPicture) {
        if (!this.db)
            throw new Error('Database not initialized');
        const user = await this.getUserById(userId);
        if (!user)
            throw new Error('User not found');
        user.profile_picture = newPicture;
        await this.db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [newPicture, userId]);
    }
    async updateUserBio(userId, bio) {
        if (!this.db)
            throw new Error('Database not initialized');
        if (bio.length > 150)
            throw new Error('Bio exceeds 150 characters');
        await this.db.run('UPDATE users SET bio = ? WHERE id = ?', [bio, userId]);
    }
    //********************COMMUNITY-PART*******************************
    async getAllUsernames() {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.all('SELECT username FROM users');
        return result.map((row) => row.username);
    }
    async getAllUsernamesWithIds() {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.all('SELECT id, username, profile_picture, email, bio FROM users');
        return result;
    }
    //********************MESSAGES-PART*******************************
    async saveMessage(author, content) {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('INSERT INTO messages (author, content) VALUES (?, ?)', [author, content]);
    }
    async getLastMessages(limit = 10) {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.all('SELECT author, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT ?', [limit]);
        return result.reverse(); // Inverser pour afficher les messages dans l'ordre chronologique
    }
}
export const dbManager = DatabaseManager.getInstance();
