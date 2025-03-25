export interface UserLibrary {
    id: number;
    userName: string;
    profilePicture: string;
    library: number[];
}

export class UserLibraryManager 
{
    private static readonly STORAGE_KEY = 'userLibrary';

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
            profilePicture: '../../assets/profilePicture.jpeg',
            library: [],
        };

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newLibrary));
        return newLibrary;
    }
    

    static hasGame(gameId: number): boolean
    {
        const user = this.getUser();
        if (user.library.includes(gameId))
        {
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

    