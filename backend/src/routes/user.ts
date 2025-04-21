import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { dbManager } from "../database/database.js";
import { JWT_SECRET } from "../server.js";

const getInfosHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = request.cookies.token;
        console.log("getInfosHandler - Token:", token ? "Présent" : "Absent");
        
        if (!token) {
            console.log("getInfosHandler - Token absent, renvoi 401");
            return reply.status(401).send({
                success: false,
                message: "Non authentifié"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        console.log("getInfosHandler - Token décodé, userId:", decoded.userId);
        
        const user = await dbManager.getUserById(decoded.userId);
        console.log("getInfosHandler - Utilisateur trouvé:", user ? "Oui" : "Non");
        
        if (!user) {
            console.log("getInfosHandler - Utilisateur non trouvé, renvoi 404");
            return reply.status(404).send({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        console.log("getInfosHandler - Renvoi des informations utilisateur:", user);
        return reply.send({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture,
                bio: user.bio || '',
                created_at: user.created_at,
                library: user.library || []
            }
        });
    } catch (error) {
        console.error("Erreur détaillée dans getInfosHandler:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const getUserLibraryHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = request.cookies.token;
        if (!token) {
            return reply.status(401).send({
                success: false,
                message: "Non authentifié"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const user = await dbManager.getUserById(decoded.userId);
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "Utilisateur non trouvé"
            });
        }

        const library = await dbManager.getUserLibrary(decoded.userId);
        return reply.send({
            success: true,
            library: library
        });
    } catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const addGameHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = request.cookies.token;
        if (!token) {
            return reply.status(401).send({
                success: false,
                message: "Non authentifié"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const { gameId } = request.body as { gameId: number };

        await dbManager.addGameToLibrary(decoded.userId, gameId);
        return reply.send({
            success: true,
            message: "Jeu ajouté à la bibliothèque"
        });
    } catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const changePictureHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = request.cookies.token;
        if (!token) {
            return reply.status(401).send({
                success: false,
                message: "Non authentifié"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const file = await request.file();
        if (!file) {
            return reply.status(400).send({
                success: false,
                message: "Aucun fichier n'a été uploadé"
            });
        }

        const buffer = await file.toBuffer();
        const filename = `${decoded.userId}.jpg`;
        const filepath = `uploads/profile_pictures/${filename}`;

        await dbManager.changeUserPicture(decoded.userId, filepath);
        return reply.send({
            success: true,
            message: "Photo de profil mise à jour",
            profile_picture: filepath
        });
    } catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

const updateBioHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = request.cookies.token;
        if (!token) {
            return reply.status(401).send({
                success: false,
                message: "Non authentifié"
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const { bio } = request.body as { bio: string };

        await dbManager.updateUserBio(decoded.userId, bio);
        return reply.send({
            success: true,
            message: "Bio mise à jour"
        });
    } catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

export const userRoutes = {
    getInfos: getInfosHandler,
    getUserLibrary: getUserLibraryHandler,
    addGame: addGameHandler,
    changePicture: changePictureHandler,
    updateBio: updateBioHandler
};
