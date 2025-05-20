import { FastifyReply, FastifyRequest } from "fastify";
import { dbManager } from "../database/database.js";



const getAllNewsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try
    {
        const news = await dbManager.getAllNews();
        return reply.status(200).send(news);
    }
    catch (error)
    {
        console.error("Error fetching news:", error);
        return reply.status(500).send({
            success: false,
            message: "Error fetching news"
        });
    }
}

export const newsRoutes = 
{
    getAllNews: getAllNewsHandler
};
