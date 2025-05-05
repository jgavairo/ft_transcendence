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
    attempting_friend_ids?: number[];
    friends: number [];
    friend_requests: number[];
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

    public async isFriend(userId: number, targetId: number): Promise<boolean>
    {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.get('SELECT friends FROM users WHERE id = ?', [userId]);
        if (!result)
            throw new Error('User not found');
        
        return result.friends.includes(targetId);
    }

    public async isRequesting(userId: number, targetId: number): Promise<boolean>
    {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.get('SELECT attempting_friend_ids FROM users WHERE id = ?', [userId]);
        return result.attempting_friend_ids.includes(targetId);
    }

    public async isRequested(userId: number, targetId: number): Promise<boolean>
    {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.get('SELECT friend_requests FROM users WHERE id = ?', [userId]);
        return result.friend_requests.includes(targetId);
    }

    public async acceptFriendRequest(userId: number, targetId: number): Promise<void>
    {
        if (!this.db) throw new Error('Database not initialized');

        // Récupérer les données actuelles
        const userData = await this.db.get('SELECT friends, friend_requests FROM users WHERE id = ?', [userId]);
        const targetData = await this.db.get('SELECT friends, attempting_friend_ids FROM users WHERE id = ?', [targetId]);

        if (!userData || !targetData) throw new Error('User not found');

        // Mettre à jour les amis de l'utilisateur
        const updatedUserFriends = [...userData.friends, targetId];
        await this.db.run('UPDATE users SET friends = ? WHERE id = ?', 
            [JSON.stringify(updatedUserFriends), userId]);

        // Mettre à jour les amis de la cible
        const updatedTargetFriends = [...targetData.friends, userId];
        await this.db.run('UPDATE users SET friends = ? WHERE id = ?', 
            [JSON.stringify(updatedTargetFriends), targetId]);

        // Supprimer la demande de l'utilisateur
        const updatedUserRequests = userData.friend_requests.filter((id: number) => id !== targetId);
        await this.db.run('UPDATE users SET friend_requests = ? WHERE id = ?', 
            [JSON.stringify(updatedUserRequests), userId]);

        // Supprimer l'ID de la liste des tentatives de la cible
        const updatedTargetAttempting = targetData.attempting_friend_ids.filter((id: number) => id !== userId);
        await this.db.run('UPDATE users SET attempting_friend_ids = ? WHERE id = ?', 
            [JSON.stringify(updatedTargetAttempting), targetId]);
    }
    
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
    
    //********************FRIENDS-PART*******************************

    public async sendFriendRequest(senderId: number, receiverId: number): Promise<void>
    {
        if (!this.db) throw new Error('Database not initialized');
        //verifier si la requete n'existe pas deja 
        const result = await this.db.get('SELECT friend_requests, attempting_friend_ids FROM users WHERE id = ?', [senderId]);
        if (result)
        {
            if (result.friend_requests.includes(receiverId) || result.attempting_friend_ids.includes(receiverId))
                throw new Error('Friend request already exists');
        }

        //verifier si l'utilisateur est deja ami
        const result2 = await this.db.get('SELECT friends FROM users WHERE id = ?', [receiverId]);
        if (result2)
        {
            if (result2.friends.includes(senderId))
                throw new Error('User is already friends');
        }
        //ajouter la requete a la base de donnees
        console.log("in database.ts sendFriendRequest 1----1");
        // ajouter senderID dans request de receiverID
        await this.db.run('UPDATE users SET friend_requests = ? WHERE id = ?', [JSON.stringify([...result.friend_requests, senderId]), receiverId]);
        console.log("in database.ts sendFriendRequest 2----2");
        // ajouter receiverID dans attemping friends de senderID
        await this.db.run('UPDATE users SET attempting_friend_ids = ? WHERE id = ?', [JSON.stringify([...result.attempting_friend_ids, receiverId]), senderId]);
        console.log("in database.ts sendFriendRequest 3----3");
        // envoyer la notification par socket a recevierID
        console.log("in database.ts sendFriendRequest 4----4");
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

    public async incrementPlayerWins(gameId: number, userId: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Vérifier si une entrée existe déjà pour ce joueur et ce jeu
        const existingRanking = await this.db.get(
            'SELECT id, ranking FROM game_user_rankings WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (existingRanking) {
            // Si une entrée existe, incrémenter le classement
            await this.db.run(
                'UPDATE game_user_rankings SET ranking = ranking + 1 WHERE id = ?',
                [existingRanking.id]
            );
            console.log(`Updated ranking for user ${userId} in game ${gameId}:`, {
                id: existingRanking.id,
                newRanking: existingRanking.ranking + 1,
            });
        } else {
            // Si aucune entrée n'existe, en créer une avec un classement initial de 1
            const result = await this.db.run(
                'INSERT INTO game_user_rankings (game_id, user_id, ranking) VALUES (?, ?, ?)',
                [gameId, userId, 1]
            );
            console.log(`Created new ranking for user ${userId} in game ${gameId}:`, {
                id: result.lastID,
                gameId,
                userId,
                ranking: 1,
            });
        }
    }

    public async getUserRankingsByGame(gameId: number): Promise<{ userId: number, ranking: number }[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.all(
            'SELECT user_id AS userId, ranking FROM game_user_rankings WHERE game_id = ? ORDER BY ranking DESC',
            [gameId]
        );

        return result;
    }

}

export const dbManager = DatabaseManager.getInstance();