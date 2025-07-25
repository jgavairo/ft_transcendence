import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import { dbManager } from "../database/database.js";
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

interface FirstGameBody {
  gameId: number;
  mode:   number;
}


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

const isFirstGameHandler = async ( request: FastifyRequest, reply:   FastifyReply): Promise<void> => {
  try {
    // // run your auth middleware first
    // await authMiddleware(request as AuthenticatedRequest, reply);

    // now cast body
    const { gameId, mode } = request.body as { gameId: number; mode: number };
    if (typeof gameId !== 'number' || typeof mode !== 'number') {
      return reply.status(400).send({ success: false, message: "Missing or invalid gameId/mode" });
    }
    const userId = (request as AuthenticatedRequest).user.id;

    const firstGame = await dbManager.isFirstGame(userId, gameId, mode);
    reply.send({ success: true, firstGame });
    } catch (error) {
      console.error("Error checking first game:", error);
      return reply.status(500).send({
        success: false,
        message: "Error checking first game"
      });
    }
  };

  export const hasPlayedHandler = async (
    request: FastifyRequest<{
      Params: { gameId: string; mode: string }
    }>,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      // L’utilisateur est déjà authentifié par le preHandler
      const userId = (request as AuthenticatedRequest).user.id;
      const gameId = Number(request.params.gameId);
      const mode   = Number(request.params.mode);
      if (isNaN(gameId) || isNaN(mode)) {
        return reply.status(400).send({ success: false, message: "Missing or invalid gameId/mode" });
      }
  
      const hasPlayed = await dbManager.hasPlayed(userId, gameId, mode);
      return reply.send({ success: true, hasPlayed });
    } catch (err) {
      console.error('Error in hasPlayedHandler:', err);
      return reply
        .status(500)
        .send({ success: false, message: 'Internal server error' });
    }
  };

// --- ROOM EXISTS HANDLER ---
export const roomExistsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        // On récupère la Map des rooms privées depuis le module matchmaking
        const { privateRooms } = await import('../games/pong/matchmaking.js');
        const roomId = (request.query as any).roomId as string;
        if (!roomId) {
            return reply.status(400).send({ success: false, message: 'Missing roomId' });
        }
        const exists = privateRooms && privateRooms.has(roomId);
        return reply.send({ success: true, exists });
    } catch (err) {
        return reply.status(500).send({ success: false, message: 'Internal error' });
    }
};

export const gameRoutes = 
{
    getAllGames: getAllGamesHandler,
    isFirstGame: isFirstGameHandler,
    hasPlayed: hasPlayedHandler,
    roomExists: roomExistsHandler
};