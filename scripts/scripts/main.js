var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { storePage, header } from "./sourcepage.js";
import { setupHeader } from "./navigation.js";
import { setupStore } from "./store.js";
import api from "./api.js";
import { LoginManager } from "./loginModal.js";
export class MainApp {
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("init");
            document.addEventListener('DOMContentLoaded', () => __awaiter(this, void 0, void 0, function* () {
                yield this.setupHeader();
                this.setupCurrentPage();
            }));
        });
    }
    static setupHeader() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("setupHeader");
            const headerElement = document.getElementById('header');
            if (!headerElement) {
                console.error('Header element not found');
                return;
            }
            if (yield LoginManager.isLoggedIn()) {
                const userInfos = yield this.getUserInfo();
                console.log('User infos:', userInfos);
                if (!userInfos) {
                    console.error('User infos not found');
                    return;
                }
                headerElement.innerHTML = header(userInfos.username, userInfos.profile_picture);
                setupHeader();
            }
            else {
                console.error('User not logged in');
                LoginManager.showLoginModal();
            }
        });
    }
    static setupCurrentPage() {
        console.log("setupCurrentPage");
        const mainElement = document.getElementById('main');
        if (!mainElement) {
            console.error('Main element not found');
            return;
        }
        mainElement.innerHTML = storePage;
        setupStore();
    }
}
_a = MainApp;
MainApp.checkAuth = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield api.get('http://127.0.0.1:3000/api/auth/check');
    const text = yield response.text();
    const data = JSON.parse(text);
    return data;
});
MainApp.getUserInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield api.get('http://127.0.0.1:3000/api/header');
        const text = yield response.text();
        const data = JSON.parse(text);
        if (data.success) {
            return data;
        }
    }
    catch (error) {
        console.error('Erreur:', error);
    }
});
console.log("MainApp");
MainApp.init();
