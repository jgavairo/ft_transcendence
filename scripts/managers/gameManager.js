import api from "../helpers/api.js";
export class GameManager {
    static async getGameList() {
        const response = await api.get('/api/games/getAll');
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }
        return data.games;
    }
    static async getCurrentUser() {
        const response = await api.get('/api/user/infos');
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }
        return data.user;
    }
}
