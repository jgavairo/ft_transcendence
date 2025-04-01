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
			console.log('User complet:', JSON.stringify(user, null, 2));
			res.json({
				success: true,
				message: "User found",
				username: user.username,
				email: user.email,
				profile_picture: user.profile_picture
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

export const userRoutes = 
{
	getInfos: getInfosHandler,
	getUserLibrary: getUserLibraryHandler
}
