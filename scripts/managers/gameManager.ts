import api from "../helpers/api.js";


export interface Game 
{
    id: number;
    name: string;
    price: number;
    description: string;
    image: string;
}

export class GameManager
{
    static async getGameList(): Promise<Game[]>
    {
        const response = await api.get('/api/games/getAll');
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }
        return data.games;
    }

    static async getCurrentUser(): Promise<any>
    {
        const response = await api.get('/api/user/infos');
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }
        return data.user;
    }
}