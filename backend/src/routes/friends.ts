import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";


function sendRequestHandler(request: FastifyRequest, reply: FastifyReply) 
{

}

export const friendsRoutes = {
    sendRequest : sendRequestHandler
}