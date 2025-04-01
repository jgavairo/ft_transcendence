import api from './api.js';

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

    static getUser(): UserLibrary
    {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) 
        {
            return JSON.parse(stored);
        }

        const newLibrary: UserLibrary = {
            id: 0,
            userName: 'jgavairo',
            email: 'jgavairo@student.42.fr',
            profilePicture: '../assets/profile_pictures/default.png',
            library: [],
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newLibrary));
        return newLibrary;
    }
    

    static async hasGame(gameId: number): Promise<boolean>
    {
        console.log("Checking if game is in library:", gameId);
        const response = await api.get('http://127.0.0.1:3000/api/getLibrary');
        console.log("API response:", response);
        const data = await response.json();
        console.log("API data:", data);
        if (data.success)
        {
            console.log("if SUCCESSGame id:", gameId);
            console.log("if SUCCESSLibrary:", data.library);
            if (data.library.includes(gameId))
                return true;
        }
        return false;
    }
    
    static addGame(gameId: number): void
    {
        const user = this.getUser();
        if (!user.library.includes(gameId)) {
            user.library.push(gameId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        }
    }
    public static getLibraryGames(): number[] {
        return this.getUser().library;
    }
}      

    