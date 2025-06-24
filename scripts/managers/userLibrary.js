import api from '../helpers/api.js';
import { HOSTNAME } from '../main.js';
export class UserLibraryManager {
    static async hasGame(gameId) {
        const response = await api.get(`https://${HOSTNAME}:8443/api/user/library`);
        const data = await response.json();
        if (data.success) {
            if (data.library.includes(gameId))
                return true;
        }
        return false;
    }
    static async addGame(gameId) {
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/addGame`, { gameId });
        const data = await response.json();
        if (!data.success) {
            console.error("Game not added to library:", gameId);
        }
    }
    static async getLibraryGames() {
        const response = await api.get(`https://${HOSTNAME}:8443/api/user/library`);
        const data = await response.json();
        if (data.success)
            return data.library;
        else
            return [];
    }
}
