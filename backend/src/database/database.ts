import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir l'équivalent de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface User {
    id?: number;
    username: string;
    email: string;
    password_hash: string;
    profile_picture: string;
    bio?: string; // Nouvelle propriété pour la bio
    created_at?: number;
    library?: number[];
}

export class DatabaseManager
{
    private static instance: DatabaseManager;
    private db: Database | null = null;

    private constructor() {};

    public static getInstance(): DatabaseManager
    {
        if (!DatabaseManager.instance)
            DatabaseManager.instance = new DatabaseManager();
        return DatabaseManager.instance;
    }

    public async initialize(): Promise<void>
    {
        if (this.db)
            return;

        try
        {
            this.db = await open({
                filename: './data/database.db',
                driver: sqlite3.Database
            });

            const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            await this.db.exec(schema);
            console.log('database initialized successfully');
        }
        catch (error)
        {
            console.error('Erreur lors de l\'initialisation de la base de données:', error);
            throw error;
        }
    }

    public async registerUser(user: User): Promise<number> {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.run(
            'INSERT INTO users (username, email, password_hash, profile_picture, bio, library) VALUES (?, ?, ?, ?, ?, ?)',
            [user.username, user.email, user.password_hash, user.profile_picture, '', JSON.stringify([])]
        );
        if (!result.lastID)
            throw new Error('Failed to create new user');
        return result.lastID;
    }

    public async getUserByUsername(username: string): Promise<User | null>
    {
        if (!this.db)
            throw new Error('Database not initialized');

        const result = await this.db.get(
            'SELECT * FROM users WHERE username = ?',
            [username]);
        return result;
    }

    public async getUserById(id: number): Promise<User | null> {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return result;
    }

    public async getUserByEmail(email: string): Promise<User | null>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get
        (
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return result;
    }

    public async getUserLibrary(userId: number): Promise<number[]>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get
        (
            'SELECT library FROM users WHERE id = ?',
            [userId]
        );
        console.log("Raw library result:", result);
        if (!result || !result?.library)
        {
            await this.db.run
            (
                'UPDATE users SET library = ? WHERE id = ?',
                [JSON.stringify([]), userId]
            )
            return [];
        }
        try {
            const libraryStr = result.library.startsWith('"') ? 
            result.library.slice(1, -1) : result.library;
            console.log("Library string to parse:", libraryStr);
            return JSON.parse(libraryStr);  // Reconvertir en tableau
        } catch (error) {
            console.error('Erreur lors de la conversion:', error);
            return [];
        }
    }

    public async addGameToLibrary(userId: number, gameId: number): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        
        const library = await this.getUserLibrary(userId);
        console.log("Library before adding game:", library);
        
        if (!library.includes(gameId)) 
        {  // Éviter les doublons
            library.push(gameId);
            console.log("Library after adding game:", library);
            
            // Ajouter cette ligne pour sauvegarder dans la base de données
            await this.db.run(
                'UPDATE users SET library = ? WHERE id = ?',
                [JSON.stringify(library), userId]
            );
        }
    }

    public async changeUserPicture(userId: number, newPicture: string): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        
        const user = await this.getUserById(userId);
        if (!user)
            throw new Error('User not found');
        user.profile_picture = newPicture;
        await this.db.run(
            'UPDATE users SET profile_picture = ? WHERE id = ?',
            [newPicture, userId]
        );
    }

    public async updateUserBio(userId: number, bio: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        if (bio.length > 150) throw new Error('Bio exceeds 150 characters');
        await this.db.run(
            'UPDATE users SET bio = ? WHERE id = ?',
            [bio, userId]
        );
    }

    //********************COMMUNITY-PART*******************************

    public async getAllUsernames(): Promise<string[]>
    {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.all('SELECT username FROM users');
        return result.map((row: { username: string }) => row.username);
    }

    public async getAllUsernamesWithIds(): Promise<{ id: number, username: string, profile_picture: string, email: string, bio: string }[]> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.all('SELECT id, username, profile_picture, email, bio FROM users');
        return result;
    }

    //********************MESSAGES-PART*******************************

    public async saveMessage(author: string, content: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.run(
            'INSERT INTO messages (author, content) VALUES (?, ?)',
            [author, content]
        );
    }

    public async getLastMessages(limit: number = 10): Promise<{ author: string, content: string, timestamp: string }[]> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.all(
            'SELECT author, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT ?',
            [limit]
        );
        return result.reverse(); // Inverser pour afficher les messages dans l'ordre chronologique
    }
}

export const dbManager = DatabaseManager.getInstance();