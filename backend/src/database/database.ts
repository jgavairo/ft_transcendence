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
    created_at?: number;
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
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [user.username, user.email, user.password_hash]);
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
}

export const dbManager = DatabaseManager.getInstance();