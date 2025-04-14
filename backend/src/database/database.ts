import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import fs from 'fs';
import path from 'path';

export interface User
{
    id?: number;
    username: string;
    email: string;
    password_hash: string;
    profile_picture: string;
    created_at?: number;
    library?: number[];
}

class DatabaseManager
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
                filename: '/app/data/database.db',
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

    public async registerUser(user: User): Promise<number>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.run(
            'INSERT INTO users (username, email, password_hash, profile_picture, library) VALUES (?, ?, ?, ?, ?)',
            [user.username, user.email, user.password_hash, user.profile_picture, JSON.stringify([])]);
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
    
    public async getUserById(id: number): Promise<User | null>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get
        (
            'SELECT * FROM users WHERE id = ?',
            [id]
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
    
    if (!library.includes(gameId)) {  // Éviter les doublons
        library.push(gameId);
        console.log("Library after adding game:", library);
        
        // Ajouter cette ligne pour sauvegarder dans la base de données
        await this.db.run(
            'UPDATE users SET library = ? WHERE id = ?',
            [JSON.stringify(library), userId]
        );
    }
}
}

export const dbManager = DatabaseManager.getInstance();