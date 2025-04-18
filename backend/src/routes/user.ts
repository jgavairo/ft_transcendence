import { RequestHandler } from "express";
import jwt from 'jsonwebtoken';
import { dbManager } from "../database/database";
import { JWT_SECRET } from "../server";

const getInfosHandler: RequestHandler = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.json({
                success: false,
                message: "User non authenified"
            });
            return;
        }
        
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const user = await dbManager.getUserById(decoded.userId);
        
        if (!user) {
            res.clearCookie('token');
            res.json({
                success: false,
                message: "User not found in database",
                clearToken: true
            });
            return;
        }
        else
        {
            res.json({
                success: true,
                message: "User found",
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture,
                bio: user.bio // Ajout de la bio
            });
        }
    } catch (error) {
        console.error('Erreur détaillée:', error);
        res.json({
            success: false,
            message: "Error while getting user"
        });
    }
};

const getUserLibraryHandler: RequestHandler = async (req, res) =>
{
	try {
		const token = req.cookies.token;
		if (!token) {
			console.log("No token");
			res.json({
				success: false,
				message: "User non authenified"
			});
		}
		
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
		const user = await dbManager.getUserById(decoded.userId);

		if (!user) {
			console.log("NO USER");
			res.json({
				success: false,
				message: "User not found"
			});
			return;
		}
		else
		{
			console.log("USER FOUND");
			const userGameLibrary = await dbManager.getUserLibrary(decoded.userId);
			console.log('Library before sending:', userGameLibrary);
			res.json({
				success: true,
				message: "User found",
				library: userGameLibrary
			});
		}
	} catch (error) {
		console.log("ERROR");
		console.error('Erreur détaillée:', error);
		res.json({
			success: false,
			message: "Error while getting user"
		});
	}
}

const addGameHandler: RequestHandler = async (req, res) =>
{
	console.log("IN ADD GAME HANDLER");
	const { gameId } = req.body;
	try 
	{
		const token = req.cookies.token;
		if (!token) {
			res.json({
				success: false,
				message: "User non authenified"
			});
		}
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
		const user = await dbManager.getUserById(decoded.userId);
		if (!user) {
			res.json({
				success: false,
				message: "User not found"
			});
			return;
		}
		else
		{
			console.log("USER FOUND");
			await dbManager.addGameToLibrary(decoded.userId, gameId);
			console.log("Game added to library");
			res.json({
				success: true,
				message: "Game added to library"
			});
		}
	}
	catch (error) {
		console.error('Erreur détaillée:', error);
		res.json({
			success: false,
			message: "Error while adding game"
		});
	}
}

const getAllUsernamesHandler: RequestHandler = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const currentUserId = decoded.userId;

        const users = await dbManager.getAllUsernamesWithIds();
        const filteredUsers = users.filter(user => user.id !== currentUserId); // Exclure l'utilisateur connecté

        res.json({
            success: true,
            users: filteredUsers // Inclut la bio dans la réponse
        });
    } catch (error) {
        console.error('Error fetching usernames:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching usernames"
        });
    }
};

const changePictureHandler: RequestHandler = async (req, res) =>
{
	try
	{
		const token = req.cookies.token;
		if (!token) {
			res.json({
				success: false,
				message: "User non authenified"
			});
			return;
		}
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
		const user = await dbManager.getUserById(decoded.userId);
		if (!user)
		{
			res.json({
				success: false,
				message: "User not found"
			});
			return;
		}
		else
		{
			console.log("USER FOUND for change picture");
			const newPicture = req.file;
			if (!newPicture)
			{
				res.json({
					success: false,
					message: "No picture selected"
				});
				return;
			}
			console.log("PICTURE FOUND");
			const filePath = `http://127.0.0.1:3000/uploads/profile_pictures/${user.id}.jpg`;
			await dbManager.changeUserPicture(decoded.userId, filePath);
			res.json({
				success: true,
				message: "Picture changed",
				profile_picture: filePath
			});
		}
	}
	catch (error)
	{
		console.error('Error:', error);
		res.json({
			success: false,
			message: "Error while changing picture"
		});
	}
}

const updateBioHandler: RequestHandler = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        const userId = decoded.userId;

        const { bio } = req.body;
        if (!bio || bio.length > 150) {
            res.status(400).json({
                success: false,
                message: "Bio is required and must not exceed 150 characters"
            });
            return;
        }

        await dbManager.updateUserBio(userId, bio);
        res.json({
            success: true,
            message: "Bio updated successfully"
        });
    } catch (error) {
        console.error('Error updating bio:', error);
        res.status(500).json({
            success: false,
            message: "Error updating bio"
        });
    }
};

export const userRoutes = 
{
	getInfos: getInfosHandler,
	getUserLibrary: getUserLibraryHandler,
	addGame: addGameHandler,
	changePicture: changePictureHandler,
	getAllUsernames: getAllUsernamesHandler,
	updateBio: updateBioHandler
}
