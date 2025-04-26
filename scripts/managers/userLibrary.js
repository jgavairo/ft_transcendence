import api from '../helpers/api.js';
export class UserLibraryManager {
    static getCurrentUser() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    }
    static getUser() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const newLibrary = {
            id: 0,
            userName: 'jgavairo',
            email: 'jgavairo@student.42.fr',
            profilePicture: '../assets/profile_pictures/default.png',
            library: [],
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newLibrary));
        return newLibrary;
    }
    static async hasGame(gameId) {
        console.log("Checking if game is in library:", gameId);
        const response = await api.get('http://127.0.0.1:3000/api/user/library');
        console.log("API response:", response);
        const data = await response.json();
        console.log("API data:", data);
        if (data.success) {
            if (data.library.includes(gameId))
                return true;
        }
        return false;
    }
    static async addGame(gameId) {
        console.log("Adding game to library:", gameId);
        const response = await api.post('http://127.0.0.1:3000/api/user/addGame', { gameId });
        console.log("API response:", response);
        const data = await response.json();
        if (data.success) {
            console.log("Game added to library:", gameId);
        }
        else {
            console.log("Game not added to library:", gameId);
        }
    }
    static async getLibraryGames() {
        const response = await api.get('http://127.0.0.1:3000/api/user/library');
        const data = await response.json();
        if (data.success)
            return data.library;
        else
            return [];
    }
}
UserLibraryManager.STORAGE_KEY = 'userLibrary';
