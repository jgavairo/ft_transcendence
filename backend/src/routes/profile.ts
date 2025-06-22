import { FastifyReply, FastifyRequest } from "fastify";
import { MultipartFile } from '@fastify/multipart';
import path from "path";
import fs from "fs";
import { fileTypeFromBuffer } from 'file-type';
import { authMiddleware } from "../middleware/auth.js";
import { dbManager } from "../database/database.js";
import { AuthenticatedRequest } from "./user.js";
import { UPLOAD_SECURITY_CONFIG, UPLOAD_PATHS, FILE_VALIDATION } from "../config/security.js";

interface MultipartRequest extends FastifyRequest {
    file: () => Promise<MultipartFile | undefined>;
}

// Function to validate and purify the dimensions of an image
const validateAndPurifyImage = async (buffer: Buffer): Promise<Buffer | null> => {
    try {
        // Dynamic import to avoid compilation problems
        const { Image, createCanvas } = await import('canvas');
        const img = new Image();
        
        return new Promise((resolve) => {
            img.onload = () => {
                const { width, height } = img;
                const { MAX_IMAGE_DIMENSIONS, MIN_IMAGE_DIMENSIONS } = UPLOAD_SECURITY_CONFIG;

                // Validate the dimensions
                const isValid = width <= MAX_IMAGE_DIMENSIONS.width && 
                               height <= MAX_IMAGE_DIMENSIONS.height &&
                               width >= MIN_IMAGE_DIMENSIONS.width && 
                               height >= MIN_IMAGE_DIMENSIONS.height;

                if (!isValid) {
                    resolve(null);
                    return;
                }

                // Purify the image by redrawing it
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Resend the purified buffer (in PNG for security)
                resolve(canvas.toBuffer('image/png'));
            };

            img.onerror = () => resolve(null);
            img.src = buffer;
        });
    } catch (error) {
        console.error('Error during image validation and purification:', error);
        return null;
    }
};

const changePictureHandler = async (request: MultipartRequest, reply: FastifyReply) => 
{
    try 
    {
        // Check authentication
        await authMiddleware(request as AuthenticatedRequest, reply);
        const userId = (request as AuthenticatedRequest).user.id;

        // Get the uploaded file
        const data = await request.file();
        if (!data) {
            return reply.status(400).send({ 
                success: false, 
                message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.NO_FILE
            });
        }

        // Check the file size
        let buffer = await data.toBuffer();
        if (FILE_VALIDATION.CHECK_FILE_SIZE && buffer.length > UPLOAD_SECURITY_CONFIG.MAX_FILE_SIZE) {
            return reply.status(400).send({ 
                success: false, 
                message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.FILE_TOO_LARGE(UPLOAD_SECURITY_CONFIG.MAX_FILE_SIZE)
            });
        }

        // Check the MIME type on the server side
        if (FILE_VALIDATION.CHECK_MIME_TYPE && !data.mimetype.startsWith('image/')) {
            return reply.status(400).send({ 
                success: false, 
                message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.INVALID_MIME_TYPE
            });
        }

        // Advanced verification with file-type (magic bytes)
        if (FILE_VALIDATION.CHECK_MAGIC_BYTES) {
            const fileType = await fileTypeFromBuffer(buffer);
            if (!fileType || !UPLOAD_SECURITY_CONFIG.ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
                return reply.status(400).send({ 
                    success: false, 
                    message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.INVALID_FORMAT
                });
            }

            // Check the file extension
            if (FILE_VALIDATION.CHECK_EXTENSION) {
                const fileExtension = path.extname(data.filename).toLowerCase();
                if (!UPLOAD_SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
                    return reply.status(400).send({ 
                        success: false, 
                        message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.INVALID_EXTENSION
                    });
                }

                // Check that the extension corresponds to the detected type
                const expectedExtension = fileType.ext;
                if (fileExtension !== `.${expectedExtension}` && 
                    !(fileExtension === '.jpg' && expectedExtension === 'jpeg')) {
                    return reply.status(400).send({ 
                        success: false, 
                        message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.EXTENSION_MISMATCH
                    });
                }
            }

            // Check the dimensions of the image
            if (FILE_VALIDATION.CHECK_DIMENSIONS) {
                try {
                    const purifiedBuffer = await validateAndPurifyImage(buffer);
                    if (!purifiedBuffer) {
                        return reply.status(400).send({ 
                            success: false, 
                            message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.INVALID_DIMENSIONS(
                                UPLOAD_SECURITY_CONFIG.MAX_IMAGE_DIMENSIONS.width,
                                UPLOAD_SECURITY_CONFIG.MAX_IMAGE_DIMENSIONS.height
                            )
                        });
                    }
                     // Utiliser le buffer purifié pour la suite
                    buffer = purifiedBuffer;
                } catch (error) {
                    console.warn('Could not validate image dimensions, skipping this check');
                }
            }
        }

        // Create the uploads/profile_pictures directory if it doesn't exist
        const uploadDir = UPLOAD_PATHS.PROFILE_PICTURES;
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Get the file type for the extension
        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType) {
            return reply.status(400).send({ 
                success: false, 
                message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.INVALID_FORMAT
            });
        }

        // Generate the file name with the detected extension
        const newFilename = `${userId}.${fileType.ext}`;
        const filePath = path.join(uploadDir, newFilename);

        // Delete the old photo if it exists
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
            console.error('Error while deleting old profile picture:', error);
        }

        // Save the new file
        await fs.promises.writeFile(filePath, buffer);

        // Update the path in the database
        const relativePath = `/uploads/profile_pictures/${newFilename}`;
        await dbManager.changeUserPicture(userId, relativePath);

        return reply.send({
            success: true,
            message: 'Profile picture updated',
            path: relativePath
        });
    } catch (error) {
        console.error('Error while changing profile picture:', error);
        return reply.status(500).send({
            success: false,
            message: UPLOAD_SECURITY_CONFIG.ERROR_MESSAGES.SERVER_ERROR
        });
    }  
};
    
const updateBioHandler = async (request: FastifyRequest, reply: FastifyReply) => 
{
    try 
    {
        await authMiddleware(request as AuthenticatedRequest, reply);
        const user = await dbManager.getUserById((request as AuthenticatedRequest).user.id);
        if (!user || !user.id)
        {
            return reply.status(404).send({
                success: false,
                message: "User not found"
            });
        }
        const bioRegex = /^[a-zA-Z0-9\s]{1,150}$/;
        if (!bioRegex.test((request.body as { bio: string }).bio))
        {
            return reply.status(400).send({
                success: false,
                message: "Bio must contain only letters, numbers and spaces, and be less than 150 characters"
            });
        }
        await dbManager.updateUserBio((request as AuthenticatedRequest).user.id, (request.body as { bio: string }).bio);
        return reply.send
        ({
            success: true,
            message: "Bio updated"
        });
    } 
    catch (error) 
    {
        console.error("Detailed error:", error);
        return reply.status(500).send({
            success: false,
            message: "Server error"
        });
    }
};

export const profileRoutes = 
{
    changePicture: changePictureHandler,
    updateBio: updateBioHandler
};