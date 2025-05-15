import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager, Game } from "../database/database.js";
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest } from './user.js';

const getAllGamesHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try 
    {
        const games = await dbManager.getAllGames();
        return reply.send({ success: true, games });
    }
    catch (error)
    {
        console.error("Error fetching games:", error);
        return reply.status(500).send({
            success: false,
            message: "Error fetching games"
        });
    }
}

const isFirstGameHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;
        const gameId = request.body as number;

      const firstGame = await dbManager.isFirstGame(userId, gameId);

      return reply.send({ success: true, firstGame });
    } catch (error) {
      console.error("Error checking first game:", error);
      return reply.status(500).send({
        success: false,
        message: "Error checking first game"
      });
    }
  };

export const gameRoutes = 
{
    getAllGames: getAllGamesHandler,
    isFirstGame: isFirstGameHandler
};