import { FastifyReply, FastifyRequest } from "fastify";
import { MultipartFile } from '@fastify/multipart';
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth.js";
import { dbManager } from "../database/database.js";
import { AuthenticatedRequest } from "./user.js";

interface MultipartRequest extends FastifyRequest {
    file: () => Promise<MultipartFile | undefined>;
}

const changePictureHandler = async (request: MultipartRequest, reply: FastifyReply) => 
{
    try 
    {
        // Vérifier l'authentification
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;

        // Récupérer le fichier uploadé
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ 
                success: false, 
                message: 'Aucun fichier envoyé' 
            });
        }

        // Vérifier le type de fichier
        if (!data.mimetype.startsWith('image/')) {
            return reply.status(400).send({ 
                success: false, 
                message: 'Le fichier doit être une image' 
            });
        }

        // Créer le dossier uploads/profile_pictures s'il n'existe pas
        const uploadDir = 'uploads/profile_pictures';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Générer le nom du fichier avec l'extension
        const fileExtension = path.extname(data.filename);
        const newFilename = `${userId}${fileExtension}`;
        const filePath = path.join(uploadDir, newFilename);

        // Supprimer l'ancienne photo si elle existe
        try 
        {
            const oldFiles = fs.readdirSync(uploadDir)
                .filter(file => file.startsWith(userId.toString()));
            for (const file of oldFiles) {
                const oldFilePath = path.join(uploadDir, file);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'ancienne photo:', error);
        }

        // Sauvegarder le nouveau fichier
        const buffer = await data.toBuffer();
        await fs.promises.writeFile(filePath, buffer);

        // Mettre à jour le chemin dans la base de données
        const relativePath = `/uploads/profile_pictures/${newFilename}`;
        await dbManager.changeUserPicture(userId, relativePath);

        return reply.send({
            success: true,
            message: 'Photo de profil mise à jour',
            path: relativePath
        });
    } catch (error) {
        console.error('Erreur lors du changement de photo:', error);
        return reply.status(500).send({
            success: false,
            message: 'Erreur serveur lors du changement de photo'
        });
    }  
};
    
const updateBioHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        await dbManager.updateUserBio((request as AuthenticatedRequest).user.id, (request.body as { bio: string }).bio);
        return reply.send
        ({
            success: true,
            message: "Bio mise à jour"
        });
    } 
    catch (error) 
    {
        console.error("Erreur détaillée:", error);
        return reply.status(500).send({
            success: false,
            message: "Erreur serveur"
        });
    }
};

export const profileRoutes = 
{
    changePicture: changePictureHandler,
    updateBio: updateBioHandler
};