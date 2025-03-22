export class UserLibraryManager {
    static getUser() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const newLibrary = {
            id: 0,
            userName: 'jgavairo',
            profilePicture: '',
            library: [],
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newLibrary));
        return newLibrary;
    }
    static hasGame(gameId) {
        const user = this.getUser();
        if (user.library.includes(gameId)) {
            return true;
        }
        return false;
    }
    static addGame(gameId) {
        const user = this.getUser();
        if (!user.library.includes(gameId)) {
            user.library.push(gameId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        }
    }
}
UserLibraryManager.STORAGE_KEY = 'userLibrary';
