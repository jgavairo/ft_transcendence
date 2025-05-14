import { FastifyRequest, FastifyReply } from 'fastify';
import { dbManager } from "../database/database.js";

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

const isFirstGameHandler = async (request: FastifyRequest, reply: FastifyReply) =>
{
    try
    {
        console.log('ICI IN BACKEND');
        return reply.send({ success: true })
    }
    catch (error)
    {
        console.error("Error first games:", error);
        return reply.status(500).send({
            success: false,
            message: "Error first games"
        });
    }
}

export const gameRoutes = 
{
    getAllGames: getAllGamesHandler,
    isFirstGame: isFirstGameHandler
};