import fs from 'fs';
import { dbManager } from "../database/database.js";
import { authMiddleware } from '../middleware/auth.js';
import path from 'path';
const getInfosHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        const user = await dbManager.getUserById(request.user.id);
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }
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
    }
    catch (error) {
        console.error("Erreur détaillée dans getInfosHandler:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const getUserLibraryHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        const library = await dbManager.getUserLibrary(request.user.id);
        return reply.send({
            success: true,
            library: library
        });
    }
    catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const addGameHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        await dbManager.addGameToLibrary(request.user.id, request.body.gameId);
        return reply.send({
            success: true,
            message: "Jeu ajouté à la bibliothèque"
        });
    }
    catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const changePictureHandler = async (request, reply) => {
    try {
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ success: false, message: 'No file uploaded' });
        }
        // Vérification du type de fichier
        if (!data.mimetype.startsWith('image/')) {
            return reply.code(400).send({
                success: false,
                message: 'Only image files are allowed'
            });
        }
        // Création du dossier uploads s'il n'existe pas
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        // Utilisation de l'ID de l'utilisateur comme nom de fichier
        const userId = request.user.id;
        const fileExtension = path.extname(data.filename);
        const filename = `${userId}${fileExtension}`;
        const filepath = path.join(uploadDir, filename);
        // Suppression de l'ancienne image si elle existe
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        // Écriture du nouveau fichier
        await data.file.pipe(fs.createWriteStream(filepath));
        // Mise à jour du chemin dans la base de données
        const relativePath = `/uploads/${filename}`;
        await dbManager.changeUserPicture(userId, relativePath);
        return reply.send({
            success: true,
            message: 'Profile picture updated successfully',
            path: relativePath
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        return reply.code(500).send({
            success: false,
            message: 'Error uploading file'
        });
    }
};
const updateBioHandler = async (request, reply) => {
    try {
        await authMiddleware(request, reply);
        await dbManager.updateUserBio(request.user.id, request.body.bio);
        return reply.send({
            success: true,
            message: "Bio mise à jour"
        });
    }
    catch (error) {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};
const getAllUsersHandler = async (request, reply) => {
    try {
        const users = await dbManager.getAllUsernamesWithIds();
        return reply.send({
            success: true,
            users: users
        });
    }
    catch (error) {
        console.error('Error fetching usernames:', error);
        return reply.status(500).send({
            success: false,
            message: "Erreur lors de la récupération des utilisateurs"
        });
    }
};
export const userRoutes = {
    getInfos: getInfosHandler,
    getUserLibrary: getUserLibraryHandler,
    getAllUsers: getAllUsersHandler,
    addGame: addGameHandler,
    changePicture: changePictureHandler,
    updateBio: updateBioHandler
};
