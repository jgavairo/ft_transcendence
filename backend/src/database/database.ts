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
                        description: "Pong is a two-dimensional sports game that simulates table tennis. The player controls an in-game paddle by moving it vertically along the left or right side of the screen, and can use the paddle to hit a ball back and forth across the screen. The goal is to manoeuvre the ball past the opponent's paddle and into the opposing side's court, and to prevent the ball from being hit back into their own court",
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

    public async addGameToLibrary(userId: number, gameId: number): Promise<void> {
        if (!this.db)
            throw new Error('Database not initialized');
        
        // Ajouter le jeu à la bibliothèque de l'utilisateur
        const library = await this.getUserLibrary(userId);
        if (!library.includes(gameId)) { // Éviter les doublons
            library.push(gameId);
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
            await this.db.run(
                'UPDATE games SET user_ids = ? WHERE id = ?',
                [JSON.stringify(userIds), gameId]
            );
        }

        // Initialiser les statistiques de classement (wins et losses) à zéro
        const existingRanking = await this.db.get(
            'SELECT * FROM game_user_rankings WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (!existingRanking) {
            await this.db.run(
                'INSERT INTO game_user_rankings (game_id, user_id, win, loss) VALUES (?, ?, ?, ?)',
                [gameId, userId, 0, 0]
            );
            console.log(`Initialized stats for user ${userId} in game ${gameId} (wins: 0, losses: 0).`);
        } else {
            console.log(`Stats already exist for user ${userId} in game ${gameId}.`);
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
    
    //********************FRIENDS-PART*******************************
    
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
        if (!result)
            throw new Error('User not found');

        return result.attempting_friend_ids.includes(targetId);
    }

    public async isRequested(userId: number, targetId: number): Promise<boolean>
    {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.get('SELECT friend_requests FROM users WHERE id = ?', [userId]);
        if (!result)
            throw new Error('User not found');

        return result.friend_requests.includes(targetId);
    }

    public async acceptFriendRequest(userId: number, targetId: number): Promise<void>
    {
        if (!this.db) throw new Error('Database not initialized');

        // Récupérer les données actuelles
        const userData = await this.db.get('SELECT friends, friend_requests FROM users WHERE id = ?', [userId]);
        const targetData = await this.db.get('SELECT friends, attempting_friend_ids FROM users WHERE id = ?', [targetId]);

        if (!userData || !targetData) throw new Error('User not found');

        const userFriends = Array.isArray(userData.friends) ? userData.friends : JSON.parse(userData.friends || '[]');
        const userRequests = Array.isArray(userData.friend_requests) ? userData.friend_requests : JSON.parse(userData.friend_requests || '[]');
        const targetFriends = Array.isArray(targetData.friends) ? targetData.friends : JSON.parse(targetData.friends || '[]');
        const targetAttempting = Array.isArray(targetData.attempting_friend_ids) ? targetData.attempting_friend_ids : JSON.parse(targetData.attempting_friend_ids || '[]');

        if (!targetAttempting.includes(userId) || !userRequests.includes(targetId)) 
            throw new Error('Friend request is no longer valid');

        const updatedUserFriends = [...userFriends, targetId];
        const updatedTargetFriends = [...targetFriends, userId];
        const updatedUserRequests = userRequests.filter((id: number) => id !== targetId);
        const updatedTargetAttempting = targetAttempting.filter((id: number) => id !== userId);
        
        await Promise.all
        ([    
            this.db.run('UPDATE users SET attempting_friend_ids = ? WHERE id = ?', [JSON.stringify(updatedTargetAttempting), targetId]),
            this.db.run('UPDATE users SET friends = ? WHERE id = ?', [JSON.stringify(updatedUserFriends), userId]),
            this.db.run('UPDATE users SET friends = ? WHERE id = ?', [JSON.stringify(updatedTargetFriends), targetId]),
            this.db.run('UPDATE users SET friend_requests = ? WHERE id = ?', [JSON.stringify(updatedUserRequests), userId])
        ]);
    }

    public async sendFriendRequest(senderId: number, receiverId: number): Promise<void>
    {
        if (!this.db) 
            throw new Error('Database not initialized');

        const userData = await this.db.get('SELECT friends, friend_requests, attempting_friend_ids FROM users WHERE id = ?', [senderId]);
        const targetData = await this.db.get('SELECT friends, friend_requests, attempting_friend_ids FROM users WHERE id = ?', [receiverId]);

        if (!userData || !targetData)
            throw new Error('User not found');

        const userFriends = Array.isArray(userData.friends) ? userData.friends : JSON.parse(userData.friends || '[]');
        const userAttemptingFriends = Array.isArray(userData.attempting_friend_ids) ? userData.attempting_friend_ids : JSON.parse(userData.attempting_friend_ids || '[]');

        const targetFriends = Array.isArray(targetData.friends) ? targetData.friends : JSON.parse(targetData.friends || '[]');
        const targetFriendRequests = Array.isArray(targetData.friend_requests) ? targetData.friend_requests : JSON.parse(targetData.friend_requests || '[]');
        const targetAttemptingFriends = Array.isArray(targetData.attempting_friend_ids) ? targetData.attempting_friend_ids : JSON.parse(targetData.attempting_friend_ids || '[]');
    
        if (userAttemptingFriends.includes(receiverId) || targetFriendRequests.includes(senderId))
            throw new Error('Friend request already exists');

        if (targetFriends.includes(senderId) || userFriends.includes(receiverId))
            throw new Error('Already friends');

        if (targetAttemptingFriends.includes(senderId))
            throw new Error('Request already received from this user');

        await Promise.all
        ([
            this.db.run('UPDATE users SET friend_requests = ? WHERE id = ?', [JSON.stringify([...targetFriendRequests, senderId]), receiverId]),
            this.db.run('UPDATE users SET attempting_friend_ids = ? WHERE id = ?', [JSON.stringify([...userAttemptingFriends, receiverId]), senderId])
        ]);
    }
    
    public async removeFriend(userId: number, targetId: number): Promise<void>
    {
        if (!this.db) throw new Error('Database not initialized');
        
        const userData = await this.db.get('SELECT friends, friend_requests, attempting_friend_ids FROM users WHERE id = ?', [userId]);
        const targetData = await this.db.get('SELECT friends, friend_requests, attempting_friend_ids FROM users WHERE id = ?', [targetId]);
        
        if (!userData || !targetData)
            throw new Error('User not found');

        const userFriends = Array.isArray(userData.friends) ? userData.friends : JSON.parse(userData.friends || '[]');
        const userAttemptingFriends = Array.isArray(userData.attempting_friend_ids) ? userData.attempting_friend_ids : JSON.parse(userData.attempting_friend_ids || '[]');

        const targetFriends = Array.isArray(targetData.friends) ? targetData.friends : JSON.parse(targetData.friends || '[]');
        const targetFriendRequests = Array.isArray(targetData.friend_requests) ? targetData.friend_requests : JSON.parse(targetData.friend_requests || '[]');
        const targetAttemptingFriends = Array.isArray(targetData.attempting_friend_ids) ? targetData.attempting_friend_ids : JSON.parse(targetData.attempting_friend_ids || '[]');

        if (!userFriends.includes(targetId) || !targetFriends.includes(userId))
            throw new Error('Not friends');
        
        const updatedUserFriends = userFriends.filter((id: number) => id !== targetId);
        const updatedTargetFriends = targetFriends.filter((id: number) => id !== userId);
        
        await Promise.all
        ([
            this.db.run('UPDATE users SET friends = ? WHERE id = ?', [JSON.stringify(updatedUserFriends), userId]),
            this.db.run('UPDATE users SET friends = ? WHERE id = ?', [JSON.stringify(updatedTargetFriends), targetId])
        ]);
    }

    public async cancelFriendRequest(userId: number, targetId: number): Promise<void>
    {
        if (!this.db) throw new Error('Database not initialized');

        const userData = await this.db.get('SELECT friends, friend_requests, attempting_friend_ids FROM users WHERE id = ?', [userId]);
        const targetData = await this.db.get('SELECT friends, friend_requests, attempting_friend_ids FROM users WHERE id = ?', [targetId]);

        if (!userData || !targetData)
            throw new Error('User not found');

        const userAttempting = Array.isArray(userData.attempting_friend_ids) ? userData.attempting_friend_ids : JSON.parse(userData.attempting_friend_ids || '[]');
        const targetRequests = Array.isArray(targetData.friend_requests) ? targetData.friend_requests : JSON.parse(targetData.friend_requests || '[]');

        const updatedUserAttempting = userAttempting.filter((id: number) => id !== targetId);
        const updatedTargetRequests = targetRequests.filter((id: number) => id !== userId);

        await Promise.all
        ([
            this.db.run('UPDATE users SET attempting_friend_ids = ? WHERE id = ?', [JSON.stringify(updatedUserAttempting), userId]),
            this.db.run('UPDATE users SET friend_requests = ? WHERE id = ?', [JSON.stringify(updatedTargetRequests), targetId])
        ]);
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
            'SELECT id, win FROM game_user_rankings WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (existingRanking) {
            // Si une entrée existe, incrémenter le classement
            await this.db.run(
                'UPDATE game_user_rankings SET win = win + 1 WHERE id = ?',
                [existingRanking.id]
            );
            console.log(`Updated win for user ${userId} in game ${gameId}:`, {
                id: existingRanking.id,
                newRanking: existingRanking.win + 1,
            });
        } else {
            // Si aucune entrée n'existe, en créer une avec un classement initial de 1
            const result = await this.db.run(
                'INSERT INTO game_user_rankings (game_id, user_id, win, loss) VALUES (?, ?, ?, ?)',
                [gameId, userId, 1, 0]
            );
            console.log(`Created new win for user ${userId} in game ${gameId}:`, {
                id: result.lastID,
                gameId,
                userId,
                win: 1,
                loss: 0,
            });
        }
    }

    public async incrementPlayerLosses(gameId: number, userId: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Vérifier si une entrée existe déjà pour ce joueur et ce jeu
        const existingRanking = await this.db.get(
            'SELECT id, loss FROM game_user_rankings WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (existingRanking) {
            // Si une entrée existe, incrémenter les défaites
            await this.db.run(
                'UPDATE game_user_rankings SET loss = loss + 1 WHERE id = ?',
                [existingRanking.id]
            );
            console.log(`Updated losses for user ${userId} in game ${gameId}:`, {
                id: existingRanking.id,
                newLosses: existingRanking.loss + 1,
            });
        } else {
            // Si aucune entrée n'existe, en créer une avec un nombre initial de défaites de 1
            const result = await this.db.run(
                'INSERT INTO game_user_rankings (game_id, user_id, win, loss) VALUES (?, ?, ?, ?)',
                [gameId, userId, 0, 1]
            );
            console.log(`Created new ranking for user ${userId} in game ${gameId}:`, {
                id: result.lastID,
                gameId,
                userId,
                win: 0,
                loss: 1,
            });
        }
    }

    public async getUserRankingsByGame(gameId: number): Promise<{ userId: number, win: number }[]> {
        if (!this.db) throw new Error('Database not initialized');

        const result = await this.db.all(
            'SELECT user_id AS userId, win FROM game_user_rankings WHERE game_id = ? ORDER BY win DESC',
            [gameId]
        );

        return result;
    }

    public async refuseFriendRequest(userId: number, targetId: number): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // Récupérer les données actuelles des deux utilisateurs
            const userData = await this.db.get('SELECT friend_requests FROM users WHERE id = ?', [userId]);
            const targetData = await this.db.get('SELECT attempting_friend_ids FROM users WHERE id = ?', [targetId]);

            if (!userData || !targetData) throw new Error('User not found');

            // S'assurer que les listes sont des tableaux
            const userRequests = Array.isArray(userData.friend_requests) ? userData.friend_requests : JSON.parse(userData.friend_requests || '[]');
            const targetAttempting = Array.isArray(targetData.attempting_friend_ids) ? targetData.attempting_friend_ids : JSON.parse(targetData.attempting_friend_ids || '[]');

            // Vérifier que la demande existe
            if (!userRequests.includes(targetId) || !targetAttempting.includes(userId)) {
                throw new Error('Friend request does not exist');
            }

            // Mettre à jour les listes
            const updatedUserRequests = userRequests.filter((id: number) => id !== targetId);
            const updatedTargetAttempting = targetAttempting.filter((id: number) => id !== userId);

            // Sauvegarder les modifications
            await this.db.run('UPDATE users SET friend_requests = ? WHERE id = ?', [JSON.stringify(updatedUserRequests), userId]);
            await this.db.run('UPDATE users SET attempting_friend_ids = ? WHERE id = ?', [JSON.stringify(updatedTargetAttempting), targetId]);

            return true;
        } catch (error) {
            console.error('Error in refuseFriendRequest:', error);
            throw error;
        }
    }

    public async addMatchToHistory(
        user1Id: number,
        user2Id: number,
        user1Lives: number,
        user2Lives: number
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.run(
                `INSERT INTO match_history (user1_id, user2_id, user1_lives, user2_lives, match_date)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [user1Id, user2Id, user1Lives, user2Lives]
            );
            console.log(`Match added to history: User1 (${user1Id}) vs User2 (${user2Id})`);
        } catch (error) {
            console.error('Error adding match to history:', error);
            throw error;
        }
    }

    public async getLastMatchForUser(userId: number): Promise<any | null> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const result = await this.db.get(
                `SELECT * 
                 FROM match_history 
                 WHERE user1_id = ? OR user2_id = ? 
                 ORDER BY match_date DESC 
                 LIMIT 1`,
                [userId, userId]
            );

            return result || null;
        } catch (error) {
            console.error('Error fetching last match for user:', error);
            throw error;
        }
    }
}

export const dbManager = DatabaseManager.getInstance();