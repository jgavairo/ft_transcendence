var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import api from './api.js';
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
    static hasGame(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Checking if game is in library:", gameId);
            const response = yield api.get('http://127.0.0.1:3000/api/getLibrary');
            console.log("API response:", response);
            const data = yield response.json();
            console.log("API data:", data);
            if (data.success) {
                console.log("if SUCCESSGame id:", gameId);
                console.log("if SUCCESSLibrary:", data.library);
                if (data.library.includes(gameId))
                    return true;
            }
            return false;
        });
    }
    static addGame(gameId) {
        const user = this.getUser();
        if (!user.library.includes(gameId)) {
            user.library.push(gameId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        }
    }
    static getLibraryGames() {
        return this.getUser().library;
    }
}
UserLibraryManager.STORAGE_KEY = 'userLibrary';
