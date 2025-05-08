import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";
import { AuthenticatedRequest } from './user.js';

const incrementWinsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { gameId, userId } = request.body as { gameId: number; userId: number };

        if (!gameId || !userId) {
            return reply.status(400).send({ error: 'gameId and userId are required' });
        }

        await dbManager.incrementPlayerWins(gameId, userId);
        return reply.status(200).send({ 
            success: true, 
            message: `Player ${userId}'s wins incremented for game ${gameId}` 
        });
    } catch (error) {
        console.error('Error incrementing player wins:', error);
        return reply.status(500).send({ 
            success: false, 
            error: 'Failed to increment player wins' 
        });
    }
};

const incrementLossesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { gameId, userId } = request.body as { gameId: number; userId: number };

        if (!gameId || !userId) {
            return reply.status(400).send({ 
                success: false, 
                error: 'gameId and userId are required' 
            });
        }

        await dbManager.incrementPlayerLosses(gameId, userId);
        return reply.status(200).send({ 
            success: true, 
            message: `Player ${userId}'s losses incremented for game ${gameId}` 
        });
    } catch (error) {
        console.error('Error incrementing player losses:', error);
        return reply.status(500).send({ 
            success: false, 
            error: 'Failed to increment player losses' 
        });
    }
};

const getRankingsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { gameId } = request.params as { gameId: string };

        if (!gameId) {
            return reply.status(400).send({ 
                success: false, 
                error: 'gameId is required' 
            });
        }

        const rankings = await dbManager.getUserRankingsByGame(Number(gameId));
        return reply.status(200).send({ 
            success: true, 
            rankings 
        });
    } catch (error) {
        console.error('Error fetching rankings:', error);
        return reply.status(500).send({ 
            success: false, 
            error: 'Failed to fetch rankings' 
        });
    }
};

const addMatchToHistoryHandler = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
        const { user1Id, user2Id, user1Lives, user2Lives } = request.body as {
            user1Id: string | number;
            user2Id: string | number;
            user1Lives: number;
            user2Lives: number;
        };

        if (!user1Id || !user2Id || user1Lives === undefined || user2Lives === undefined) {
            return reply.status(400).send({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        // Vérification si les IDs sont des socket_id ou des ID utilisateur valides
        let validUser1Id = user1Id;
        let validUser2Id = user2Id;

        // Fonction pour vérifier si c'est un socket_id (format spécial avec caractères non numériques)
        const isSocketId = (id: string | number): boolean => {
            return typeof id === 'string' && (id.includes('_') || id.includes('-') || id.length > 10);
        };

        // Fonction pour obtenir un utilisateur par son ID
        const isValidUserId = async (id: string | number): Promise<boolean> => {
            try {
                // Convertir en nombre si c'est une chaîne numérique
                const numericId = typeof id === 'string' ? parseInt(id) : id;
                if (isNaN(numericId)) return false;
                
                // Vérifier si l'utilisateur existe
                const user = await dbManager.getUserById(numericId);
                return !!user;
            } catch (error) {
                console.error(`Error checking user ID validity for ${id}:`, error);
                return false;
            }
        };

        // Vérifier user1Id
        if (isSocketId(user1Id)) {
            console.warn(`user1Id semble être un socket_id: ${user1Id}`);
            // Pour user1Id, on peut utiliser l'ID de l'utilisateur authentifié
            if (request.user && request.user.id) {
                validUser1Id = request.user.id;
                console.log(`Remplacé user1Id par l'ID de l'utilisateur authentifié: ${validUser1Id}`);
            } else {
                return reply.status(400).send({ 
                    success: false, 
                    error: 'Invalid user1Id and no authenticated user found' 
                });
            }
        } else if (!(await isValidUserId(user1Id))) {
            return reply.status(400).send({ 
                success: false, 
                error: `user1Id ${user1Id} is not a valid user ID` 
            });
        }

        // Vérifier user2Id
        if (isSocketId(user2Id)) {
            console.warn(`user2Id semble être un socket_id: ${user2Id}`);
            // Pour user2Id on n'a pas d'alternative automatique, on rejette la requête
            return reply.status(400).send({ 
                success: false, 
                error: 'user2Id appears to be a socket_id, not a valid user ID' 
            });
        } else if (!(await isValidUserId(user2Id))) {
            return reply.status(400).send({ 
                success: false, 
                error: `user2Id ${user2Id} is not a valid user ID` 
            });
        }

        // Conversion en nombre pour la base de données
        const finalUser1Id = typeof validUser1Id === 'string' ? parseInt(validUser1Id) : validUser1Id;
        const finalUser2Id = typeof validUser2Id === 'string' ? parseInt(validUser2Id) : validUser2Id;

        // Vérifier que les deux IDs sont des nombres valides
        if (isNaN(finalUser1Id) || isNaN(finalUser2Id)) {
            return reply.status(400).send({ 
                success: false, 
                error: 'User IDs must be valid numbers after conversion' 
            });
        }

        console.log(`Ajout d'un match à l'historique: user1Id=${finalUser1Id}, user2Id=${finalUser2Id}, lives: ${user1Lives}-${user2Lives}`);
        await dbManager.addMatchToHistory(finalUser1Id, finalUser2Id, user1Lives, user2Lives);
        return reply.status(200).send({ 
            success: true, 
            message: 'Match added to history' 
        });
    } catch (error) {
        console.error('Error adding match to history:', error);
        return reply.status(500).send({ 
            success: false, 
            error: 'Failed to add match to history' 
        });
    }
};

const getMatchHistoryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { userId } = request.params as { userId: string };
        
        if (!userId) {
            return reply.status(400).send({ 
                success: false, 
                error: 'userId is required' 
            });
        }

        // Récupérer l'historique des matchs depuis la base de données
        const matchHistory = await dbManager.getMatchHistoryForUser(Number(userId));
        
        // Pour chaque match, récupérer les noms des utilisateurs
        const matchesWithNames = await Promise.all(matchHistory.map(async match => {
            const user1 = await dbManager.getUserById(match.user1_id);
            const user2 = await dbManager.getUserById(match.user2_id);
            
            return {
                ...match,
                user1Name: user1 ? user1.username : `User #${match.user1_id}`,
                user2Name: user2 ? user2.username : `User #${match.user2_id}`
            };
        }));

        return reply.status(200).send({ 
            success: true, 
            matches: matchesWithNames 
        });
    } catch (error) {
        console.error('Error fetching match history:', error);
        return reply.status(500).send({ 
            success: false, 
            error: 'Failed to fetch match history' 
        });
    }
};

export const statsRoutes = {
    incrementWins: incrementWinsHandler,
    incrementLosses: incrementLossesHandler,
    getRankings: getRankingsHandler,
    addMatchToHistory: addMatchToHistoryHandler,
    getMatchHistory: getMatchHistoryHandler
};