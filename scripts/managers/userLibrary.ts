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
    private static readonly STORAGE_KEY = 'userLibrary';

    static getCurrentUser(): UserLibrary | null {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    }

    static getUser(): UserLibrary | null
    {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) 
        {
            return JSON.parse(stored);
        }
        return null;
    }
    

    static async hasGame(gameId: number): Promise<boolean>
    {
        console.log("Checking if game is in library:", gameId);
        const response = await api.get(`https://${HOSTNAME}:8443/api/user/library`);
        console.log("API response:", response);
        const data = await response.json();
        console.log("API data:", data);
        if (data.success)
        {
            if (data.library.includes(gameId))
                return true;
        }
        return false;
    }
    
    static async addGame(gameId: number): Promise<void>
    {
        console.log("Adding game to library:", gameId);
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/addGame`, { gameId });
        console.log("API response:", response);
        const data = await response.json();
        if (data.success)
        {
            console.log("Game added to library:", gameId);
        }
        else
        {
            console.log("Game not added to library:", gameId);
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
