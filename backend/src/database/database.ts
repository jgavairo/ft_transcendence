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

export interface Game {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
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

            // Vérifier si la table games est vide
            const count = await this.db.get('SELECT COUNT(*) as count FROM games');
            if (count.count === 0) {
                // Insérer les jeux par défaut
                const defaultGames = [
                    {
                        id: 1,
                        name: "Pong",
                        price: 0,
                        description: "Pong is a two-dimensional sports game that simulates table tennis. The player controls an in-game paddle by moving it vertically along the left or right side of the screen, and can use the paddle to hit a ball back and forth across the screen. The goal is to manoeuvre the ball past the opponent's paddle and into the opposing side's court, and to prevent the ball from being hit back into their own court.",
                        image: "../../assets/games/pong/pong.png",
                    },
                    {
                        id: 3,
                        name: "Valorant",
                        price: 29.99,
                        description: "Une pale copie de Counter-Strike, mais avec des personnages de la série Rick and Morty",
                        image: "../../assets/games/valorant/valorant.png",
                    },
                    {
                        id: 2,
                        name: "Francis the Loony",
                        price: 299.99,
                        description: "Recevez une invitation mystérieuse à la soirée de Francis le Tordu (YOUPiiIIII). Dans ce jeu psychologique troublant, naviguez à travers une demeure victorienne où les règles changent constamment et où vos choix ont des conséquences... imprévisibles. Les autres invités semblent connaître les règles, mais personne ne veut les partager. Évitez les regards tordus de Francis, découvrez pourquoi certains invités disparaissent après avoir bu le cocktail du chef, et tentez de survivre jusqu'au matin. Mais attention : Francis déteste quand on refuse de danser la valse inversée",
                        image: "../../assets/games/snake/snake.png",
                    }
                ];

                for (const game of defaultGames) 
                {
                    await this.db.run(
                        'INSERT INTO games (name, price, description, image) VALUES (?, ?, ?, ?)',
                        [game.name, game.price, game.description, game.image]
                    );
                }
                console.log('Default games inserted successfully');
            }
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

    public async getUserPassword(userId: number): Promise<string>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);
        return result.password_hash;
    }

    public async updateUserPassword(userId: number, newPassword: string): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPassword, userId]);
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
        
        // Ajouter le jeu à la bibliothèque de l'utilisateur
        const library = await this.getUserLibrary(userId);
        console.log("Library before adding game:", library);
        
        if (!library.includes(gameId)) 
        {  // Éviter les doublons
            library.push(gameId);
            console.log("Library after adding game:", library);
            
            // Mettre à jour la bibliothèque de l'utilisateur
            await this.db.run(
                'UPDATE users SET library = ? WHERE id = ?',
                [JSON.stringify(library), userId]
            );
        }

        // Ajouter l'utilisateur à la liste des IDs dans la table games
        const game = await this.db.get('SELECT user_ids FROM games WHERE id = ?', [gameId]);
        if (!game)
            throw new Error('Game not found');

        let userIds: number[] = [];
        if (game.user_ids) {
            try {
                userIds = JSON.parse(game.user_ids);
            } catch (error) {
                console.error('Error parsing user_ids:', error);
            }
        }

        if (!userIds.includes(userId)) {
            userIds.push(userId);
            console.log("Updated user_ids for game:", userIds);

            // Mettre à jour la colonne user_ids dans la table games
            await this.db.run(
                'UPDATE games SET user_ids = ? WHERE id = ?',
                [JSON.stringify(userIds), gameId]
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
    //********************GAMES-PART*******************************

    public async getAllGames(): Promise<Game[]>
    {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.all('SELECT * FROM games');
        return result;
    }
}

export const dbManager = DatabaseManager.getInstance();