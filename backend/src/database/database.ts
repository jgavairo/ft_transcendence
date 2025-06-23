import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the equivalent of __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface User {
    id?: number;
    username: string;
    email: string;
    password_hash: string;
    profile_picture: string;
    bio?: string; // New property for the bio
    created_at?: number;
    library?: number[];
    attempting_friend_ids?: number[];
    friends: number [];
    friend_requests: number[];
    blocked_users?: string[]; // Added for blocking
    two_factor_enabled?: boolean;
    two_factor_code?: string;
    two_factor_code_expiration?: number;
    is_google_account?: boolean;
}

export interface Game {
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
    is_available: boolean;
}

export interface News 
{
    id?: number;
    title: string;
    content: string;
    image_url: string;
    created_at?: string;
    priority: number;
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

            // Check if the games table is empty
            const count = await this.db.get('SELECT COUNT(*) as count FROM games');
            if (count.count === 0) {
                // Insert the default games
                const defaultGames = [
                    {
                        id: 1,
                        name: "Pong",
                        price: 0,
                        description: "Pong is a two-dimensional sports game that simulates table tennis. The player controls an in-game paddle by moving it vertically along the left or right side of the screen, and can use the paddle to hit a ball back and forth across the screen. The goal is to manoeuvre the ball past the opponent's paddle and into the opposing side's court, and to prevent the ball from being hit back into their own court",
                        image: "../../assets/games/pong/pong.webp",
                        is_available: true
                    },
                    {
                        id: 3,
                        name: "Tower",
                        price: 0,
                        description: "Tower is a game where you have to defend your tower from waves of enemies.",
                        image: "../../assets/games/Tower/Tower.webp",
                        is_available: true
                    },
                    {
                        id: 4,
                        name: "Grand theft auto 6",
                        price: 0,
                        description: "Grand theft auto 6 is a game that allows you to drive a car and shoot at people.",
                        image: "../../assets/games/gta6/gta6.webp",
                        is_available: false
                    },
                    {
                        id: 5,
                        name: "Minecraft",
                        price: 0,
                        description: "Minecraft is a game that allows you to build a house and explore the world.",
                        image: "../../assets/games/minecraft/Minecraft.webp",
                        is_available: false
                    },
                    {
                        id: 6,
                        name: "Rick & Morty",
                        price: 0,
                        description: "In Rick & Morty, you play as Rick, a scientist who travels through space and time with his grandson, Morty.",
                        image: "../../assets/games/rickAndMorty/RickAndMorty.webp",
                        is_available: false
                    },
                    {
                        id: 7,
                        name: "Dofus",
                        price: 0,
                        description: "Dofus is a best-selling MMORPG game that offers a unique and immersive experience.",
                        image: "../../assets/games/dofus/Dofus.jpeg",
                        is_available: false
                    },
                    {
                        id: 8,
                        name: "Lumen",
                        price: 0,
                        description: "Lumen is a game from new studio called 'Ruptur'.",
                        image: "../../assets/games/lumen/Lumen.webp",
                        is_available: false
                    }
                ];

                for (const game of defaultGames) 
                {
                    await this.db.run(
                        'INSERT INTO games (name, price, description, image, is_available) VALUES (?, ?, ?, ?, ?)',
                        [game.name, game.price, game.description, game.image, game.is_available]
                    );
                }
                console.log('Default games inserted successfully');
            }
            const newsCount = await this.db.get('SELECT COUNT(*) as count FROM news');
            if (newsCount.count === 0) {
            // Insert the default news
            const defaultNews = [
                {
                    title: "Launch of ft_transcendence",
                    content: "Welcome on our new online gaming platform inspired by Steam. Discover the games, and challenge other players in real time!",
                    image_url: "../../assets/news/launch.webp",
                    priority: 2
                },
                {
                    title: "Pong 2.0 is now available",
                    content: "Pong 2.0 is now available! Discover the new playing mode and the new features!",
                    image_url: "../../assets/news/PongNews.webp",
                    priority: 1
                },
                {
                    title: "Grand theft auto 6 is coming",
                    content: "The new GTA 6 is coming and he will be on our favorite platform ft_transcendence !",
                    image_url: "../../assets/news/gta6.webp",
                    priority: 0
                },
                {
                    title: "Tower is now available",
                    content: "Tower is now available! Discover the new playing mode and the new features!",
                    image_url: "../../assets/games/Tower/TowerBackground.webp",
                    priority: 0
                }
            ];

            // Insert each news in the database
            for (const news of defaultNews) {
                await this.db.run(
                    'INSERT INTO news (title, content, image_url, priority) VALUES (?, ?, ?, ?)',
                    [news.title, news.content, news.image_url, news.priority]
                );
            }
            console.log('Default news inserted successfully');
        }
        }
        catch (error)
        {
            console.error('Error initializing the database:', error);
            throw error;
        }
    }

    public async registerUser(user: User): Promise<number> {
        if (!this.db)
            throw new Error('Database not initialized');
        const result = await this.db.run(
            'INSERT INTO users (username, email, password_hash, profile_picture, bio, library, is_google_account) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user.username, user.email, user.password_hash, user.profile_picture, '', JSON.stringify([]), user.is_google_account === true ? 1 : 0]
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
            'SELECT *, CASE WHEN is_google_account = 1 THEN true ELSE false END as is_google_account FROM users WHERE id = ?',
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

    public async updateUserPassword(userId: number, newPasswordHash: string): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);
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
            return JSON.parse(libraryStr);  // Reconvert to array
        } catch (error) {
            console.error('Error converting to array:', error);
            return [];
        }
    }

    public async addGameToLibrary(userId: number, gameId: number): Promise<void> {
        if (!this.db)
            throw new Error('Database not initialized');
        
        // Add the game to the user's library
        const library = await this.getUserLibrary(userId);
        if (!library.includes(gameId)) { // Avoid duplicates
            library.push(gameId);
            await this.db.run(
                'UPDATE users SET library = ? WHERE id = ?',
                [JSON.stringify(library), userId]
            );
        }

        // Add the user to the list of IDs in the games table
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

        // Initialize the ranking statistics (wins and losses) to zero
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
        const bioRegex = /^[a-zA-Z0-9\s]{1,150}$/;
        if (!bioRegex.test(bio))
        {
            throw new Error('Bio must contain only letters, numbers and spaces, and be less than 150 characters');
        }
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

        // Get the current data
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

    //********************FRIENDS-PART*******************************
    
    public async getAllFriends(userId: number): Promise<number[]> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.get('SELECT friends FROM users WHERE id = ?', [userId]);
        if (!result) throw new Error('User not found');
        let friendsArr: number[] = [];
        if (Array.isArray(result.friends)) {
            friendsArr = result.friends;
        } else if (typeof result.friends === 'string') {
            try {
                friendsArr = JSON.parse(result.friends);
            } catch (e) {
                friendsArr = [];
            }
        }
        return friendsArr;
    }
    
    //********************MESSAGES-PART*******************************
    
    public async saveMessage(authorId: number, content: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.run(
            'INSERT INTO messages (author, content) VALUES (?, ?)',
            [authorId, content]
        );
        const result = await this.db.get('SELECT COUNT(*) as count FROM messages');
        if (result.count > 50) {
            await this.db.run('DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY timestamp ASC LIMIT ?)', [result.count - 50]);
        }
    }

    public async getLastMessages(limit: number = 50): Promise<{ author: number, content: string, timestamp: string }[]> {
        if (!this.db) throw new Error('Database not initialized');
        const result = await this.db.all(
            'SELECT author, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT ?',
            [limit]
        );
        return result.reverse(); // Reverse to display messages in chronological order
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

        // Check that the parameters are valid numbers
        const numericGameId = Number(gameId);
        const numericUserId = Number(userId);
        
        if (isNaN(numericGameId) || isNaN(numericUserId)) {
            throw new Error(`Invalid parameters: gameId=${gameId}, userId=${userId}`);
        }

        try {
            // Check if an entry already exists for this player and this game
            const existingRanking = await this.db.get(
                'SELECT id, win FROM game_user_rankings WHERE game_id = ? AND user_id = ?',
                [numericGameId, numericUserId]
            );

            if (existingRanking) {
                // If an entry exists, increment the ranking
                await this.db.run(
                    'UPDATE game_user_rankings SET win = win + 1 WHERE id = ?',
                    [existingRanking.id]
                );
                console.log(`Updated win for user ${numericUserId} in game ${numericGameId}:`, {
                    id: existingRanking.id,
                    newRanking: existingRanking.win + 1,
                });
            } else {
                // If no entry exists, create one with an initial ranking of 1
                const result = await this.db.run(
                    'INSERT INTO game_user_rankings (game_id, user_id, win, loss) VALUES (?, ?, ?, ?)',
                    [numericGameId, numericUserId, 1, 0]
                );
                console.log(`Created new win for user ${numericUserId} in game ${numericGameId}:`, {
                    id: result.lastID,
                    gameId: numericGameId,
                    userId: numericUserId,
                    win: 1,
                    loss: 0,
                });
            }
        } catch (error) {
            console.error(`Error incrementing wins for user ${numericUserId} in game ${numericGameId}:`, error);
            throw error;
        }
    }

    public async incrementPlayerLosses(gameId: number, userId: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Check that the parameters are valid numbers
        const numericGameId = Number(gameId);
        const numericUserId = Number(userId);
        
        if (isNaN(numericGameId) || isNaN(numericUserId)) {
            throw new Error(`Invalid parameters: gameId=${gameId}, userId=${userId}`);
        }

        try {
            // Check if an entry already exists for this player and this game
            const existingRanking = await this.db.get(
                'SELECT id, loss FROM game_user_rankings WHERE game_id = ? AND user_id = ?',
                [numericGameId, numericUserId]
            );

            if (existingRanking) {
                // If an entry exists, increment the losses
                await this.db.run(
                    'UPDATE game_user_rankings SET loss = loss + 1 WHERE id = ?',
                    [existingRanking.id]
                );
                console.log(`Updated losses for user ${numericUserId} in game ${numericGameId}:`, {
                    id: existingRanking.id,
                    newLosses: existingRanking.loss + 1,
                });
            } else {
            // If no entry exists, create one with an initial number of losses of 1
                const result = await this.db.run(
                    'INSERT INTO game_user_rankings (game_id, user_id, win, loss) VALUES (?, ?, ?, ?)',
                    [numericGameId, numericUserId, 0, 1]
                );
                console.log(`Created new ranking for user ${numericUserId} in game ${numericGameId}:`, {
                    id: result.lastID,
                    gameId: numericGameId,
                    userId: numericUserId,
                    win: 0,
                    loss: 1,
                });
            }
        } catch (error) {
            console.error(`Error incrementing losses for user ${numericUserId} in game ${numericGameId}:`, error);
            throw error;
        }
    }

    public async getUserRankingsByGame(gameId: number): Promise<{ userId: number, win: number, loss: number }[]> {
        if (!this.db) throw new Error('Database not initialized');
    
        const result = await this.db.all(
            'SELECT user_id AS userId, win, loss FROM game_user_rankings WHERE game_id = ? ORDER BY win DESC',
            [gameId]
        );
    
        return result;
    }

    public async refuseFriendRequest(userId: number, targetId: number): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // Get the current data of the two users
            const userData = await this.db.get('SELECT friend_requests FROM users WHERE id = ?', [userId]);
            const targetData = await this.db.get('SELECT attempting_friend_ids FROM users WHERE id = ?', [targetId]);

            if (!userData || !targetData) throw new Error('User not found');

            // Ensure that the lists are arrays
            const userRequests = Array.isArray(userData.friend_requests) ? userData.friend_requests : JSON.parse(userData.friend_requests || '[]');
            const targetAttempting = Array.isArray(targetData.attempting_friend_ids) ? targetData.attempting_friend_ids : JSON.parse(targetData.attempting_friend_ids || '[]');

            // Check that the request exists
            if (!userRequests.includes(targetId) || !targetAttempting.includes(userId)) {
                throw new Error('Friend request does not exist');
            }

            // Update the lists
            const updatedUserRequests = userRequests.filter((id: number) => id !== targetId);
            const updatedTargetAttempting = targetAttempting.filter((id: number) => id !== userId);

            // Save the modifications
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
        gameId: number,
        user1Lives: number,
        user2Lives: number
    ): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // Check if a similar match has been added in the last seconds
            const recentMatch = await this.db.get(
                `SELECT * FROM match_history 
                 WHERE user1_id = ? AND user2_id = ? AND game_id = ?
                 AND user1_lives = ? AND user2_lives = ? 
                 AND datetime(match_date) >= datetime('now', '-5 seconds')
                 LIMIT 1`,
                [user1Id, user2Id, gameId, user1Lives, user2Lives]
            );

            // If a similar match already exists, don't add it
            if (recentMatch) {
                console.log(`Match similar to User1 (${user1Id}) vs User2 (${user2Id}) already exists, skipping`);
                return;
            }

            await this.db.run(
                `INSERT INTO match_history (user1_id, user2_id, game_id, user1_lives, user2_lives, match_date)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [user1Id, user2Id, gameId, user1Lives, user2Lives]
            );
            console.log(`Match added to history: User1 (${user1Id}) vs User2 (${user2Id}) for game ${gameId}`);
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

    public async getMatchHistoryForUser(userId: number, gameId?: number): Promise<any[]> {
        if (!this.db) throw new Error('Database not initialized');
        try {
            let results;
            if (gameId !== undefined && gameId !== null) {
                results = await this.db.all(
                    `SELECT * 
                     FROM match_history 
                     WHERE (user1_id = ? OR user2_id = ?) AND game_id = ?
                     ORDER BY match_date DESC 
                     LIMIT 20`,
                    [userId, userId, gameId]
                );
            } else {
                results = await this.db.all(
                    `SELECT * 
                     FROM match_history 
                     WHERE user1_id = ? OR user2_id = ? 
                     ORDER BY match_date DESC 
                     LIMIT 20`,
                    [userId, userId]
                );
            }
            return results || [];
        } catch (error) {
            console.error('Error fetching match history for user:', error);
            throw error;
        }
    }

    public async isFirstGame(
        userId: number,
        gameId: number,
        mode: number
      ): Promise<boolean> {
        if (!this.db) throw new Error('DB not initialized');

        const row = await this.db.get<{ id: number; players_ids: string }>(
          `SELECT id, players_ids
             FROM game_player
            WHERE game_id = ?
              AND mode    = ?`,
          [gameId, mode]
        );
      
        let players: string[] = [];
        let recordId: number|undefined;
      
        if (row) {
          recordId = row.id;
          try { players = JSON.parse(row.players_ids); }
          catch { players = []; }
        }
      
        const already = players.includes(String(userId));
        if (!already) {
          players.push(String(userId));
          const json = JSON.stringify(players);
      
          if (recordId) {
            await this.db.run(
              `UPDATE game_player
                  SET players_ids = ?
                WHERE id = ?`,
              [json, recordId]
            );
          } else {
            await this.db.run(
              `INSERT INTO game_player (game_id, mode, players_ids)
               VALUES (?, ?, ?)`,
              [gameId, mode, json]
            );
          }
        }
        return !already;
      }

      public async getAllNews(): Promise<News[]> {
        if (!this.db)
            throw new Error('Database not initialized');
        
        return await this.db.all(
            'SELECT * FROM news ORDER BY priority DESC, created_at DESC'
        );
    }
    
      public async hasPlayed(
        userId: number,
        gameId: number,
        mode: number
      ): Promise<boolean> {
        if (!this.db) throw new Error('DB not initialized');
      
        const row = await this.db.get<{ players_ids: string }>(
          `SELECT players_ids
             FROM game_player
            WHERE game_id = ?
              AND mode    = ?`,
          [gameId, mode]
        );
      
        if (!row) return false;
        try {
          const players: string[] = JSON.parse(row.players_ids);
          return players.includes(String(userId));
        } catch {
          return false;
        }
      }

      public async blockUser(blockerId: number, blockedUsername: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        const blocker = await this.getUserById(blockerId);
        if (!blocker) throw new Error('Blocker not found');
        const blockedUser = await this.getUserByUsername(blockedUsername);
        if (!blockedUser || !blockedUser.id) throw new Error('User to block not found');
        let blockedUsers: number[] = [];
        if (blocker.blocked_users) {
            blockedUsers = Array.isArray(blocker.blocked_users)
                ? blocker.blocked_users.map(Number)
                : JSON.parse(blocker.blocked_users as any);
        } else if ((blocker as any).blocked_users) {
            try {
                blockedUsers = JSON.parse((blocker as any).blocked_users);
            } catch { blockedUsers = []; }
        }
        if (!blockedUsers.includes(blockedUser.id)) {
            blockedUsers.push(blockedUser.id);
            await this.db.run(
                'UPDATE users SET blocked_users = ? WHERE id = ?',
                [JSON.stringify(blockedUsers), blockerId]
            );
        }
    }

    public async unblockUser(blockerId: number, blockedUsername: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');
        const blocker = await this.getUserById(blockerId);
        if (!blocker) throw new Error('Blocker not found');
        const blockedUser = await this.getUserByUsername(blockedUsername);
        if (!blockedUser || !blockedUser.id) throw new Error('User to unblock not found');
        let blockedUsers: number[] = [];
        if (blocker.blocked_users) {
            blockedUsers = Array.isArray(blocker.blocked_users)
                ? blocker.blocked_users.map(Number)
                : JSON.parse(blocker.blocked_users as any);
        } else if ((blocker as any).blocked_users) {
            try {
                blockedUsers = JSON.parse((blocker as any).blocked_users);
            } catch { blockedUsers = []; }
        }
        if (blockedUsers.includes(blockedUser.id)) {
            blockedUsers = blockedUsers.filter(u => u !== blockedUser.id);
            await this.db.run(
                'UPDATE users SET blocked_users = ? WHERE id = ?',
                [JSON.stringify(blockedUsers), blockerId]
            );
        }
    }

    public async isUserBlocked(blockerId: number, blockedUsername: string): Promise<boolean> {
        if (!this.db) throw new Error('Database not initialized');
        const blocker = await this.getUserById(blockerId);
        if (!blocker) throw new Error('Blocker not found');
        const blockedUser = await this.getUserByUsername(blockedUsername);
        if (!blockedUser || !blockedUser.id) throw new Error('User to check not found');
        let blockedUsers: number[] = [];
        if (blocker.blocked_users) {
            blockedUsers = Array.isArray(blocker.blocked_users)
                ? blocker.blocked_users.map(Number)
                : JSON.parse(blocker.blocked_users as any);
        } else if ((blocker as any).blocked_users) {
            try {
                blockedUsers = JSON.parse((blocker as any).blocked_users);
            } catch { blockedUsers = []; }
        }
        return blockedUsers.includes(blockedUser.id);
    }

    public async getBlockedUsers(blockerId: number): Promise<string[]> {
        if (!this.db) throw new Error('Database not initialized');
        const blocker = await this.getUserById(blockerId);
        if (!blocker) throw new Error('Blocker not found');
        let blockedUsers: string[] = [];
        if (blocker.blocked_users) {
            blockedUsers = Array.isArray(blocker.blocked_users)
                ? blocker.blocked_users
                : JSON.parse(blocker.blocked_users as any);
        } else if ((blocker as any).blocked_users) {
            try {
                blockedUsers = JSON.parse((blocker as any).blocked_users);
            } catch { blockedUsers = []; }
        }
        return blockedUsers;
    }

    public async updateUsername(userId: number, newUsername: string): Promise<void> 
    {
        if (!this.db) 
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET username = ? WHERE id = ?', [newUsername, userId]);
    }

    public async updateEmail(userId: number, newEmail: string): Promise<void> 
    {
        if (!this.db) 
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
        await this.db.run('UPDATE users SET two_factor_enabled = 0 WHERE id = ?', [userId]);
    }

    public async update2FACode(userId: number, code: string): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET two_factor_code = ? WHERE id = ?', [code, userId]);
        await this.db.run('UPDATE users SET two_factor_code_expiration = ? WHERE id = ?', [new Date().getTime() + 1000 * 60 * 5, userId]);
    }

    public async enable2FA(userId: number): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [userId]);
        await this.db.run('UPDATE users SET two_factor_code = NULL WHERE id = ?', [userId]);
        await this.db.run('UPDATE users SET two_factor_code_expiration = NULL WHERE id = ?', [userId]);
    }

    public async disable2FA(userId: number): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET two_factor_enabled = 0 WHERE id = ?', [userId]);
    }

    public async set2FACode(userId: number, code: string): Promise<void>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        await this.db.run('UPDATE users SET two_factor_code = ? WHERE id = ?', [code, userId]);
        await this.db.run('UPDATE users SET two_factor_code_expiration = ? WHERE id = ?', [new Date().getTime() + 1000 * 60 * 5, userId]);
    }

    public async isGoogleAccount(userId: number): Promise<boolean>
    {
        if (!this.db)
            throw new Error('Database not initialized');
        const user = await this.getUserById(userId);
        return user?.is_google_account || false;
    }
}

export const dbManager = DatabaseManager.getInstance();
