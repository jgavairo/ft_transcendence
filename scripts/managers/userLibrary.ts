import api from '../helpers/api.js';
import { HOSTNAME } from '../main.js';

export interface UserLibrary {
    id: number;
    userName: string;
    email: string;
    profilePicture: string;
    library: number[];
}

export class UserLibraryManager
{
    static async hasGame(gameId: number): Promise<boolean>
    {
        const response = await api.get(`https://${HOSTNAME}:8443/api/user/library`);
        const data = await response.json();
        if (data.success)
        {
            if (data.library.includes(gameId))
                return true;
        }
        return false;
    }
    
    static async addGame(gameId: number): Promise<void>
    {
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/addGame`, { gameId });
        const data = await response.json();
        if (!data.success)
        {
            console.error("Game not added to library:", gameId);
        }
    }
    public static async getLibraryGames(): Promise<number[]> 
    {
        const response = await api.get(`https://${HOSTNAME}:8443/api/user/library`);
        const data = await response.json();
        if (data.success)
            return data.library;
        else
            return [];
    }
}
