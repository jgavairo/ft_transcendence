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
class MainApp {
    static init() {
        console.log("init");
        document.addEventListener('DOMContentLoaded', () => {
            this.setupHeader();
            this.setupCurrentPage();
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
            const userInfos = yield this.getUserInfo();
            console.log('User infos:', userInfos);
            if (!userInfos) {
                console.error('User infos not found');
                return;
            }
            headerElement.innerHTML = header(userInfos.username, userInfos.profile_picture);
            setupHeader();
        });
    }
    static setupCurrentPage() {
        console.log("setupCurrentPage");
        const mainElement = document.getElementById('main');
        if (!mainElement) {
            console.error('Main element not found');
            return;
        }
        console.log("setupCurrentPage");
        mainElement.innerHTML = storePage;
        setupStore();
    }
}
_a = MainApp;
MainApp.getUserInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield api.get('http://127.0.0.1:3000/api/header');
        console.log('Response status:', response.status);
        const text = yield response.text();
        console.log('Response text:', text);
        const data = JSON.parse(text);
        console.log('Data après parsing:', data);
        if (data.success) {
            console.log('Profile picture:', data.profile_picture);
            return data;
        }
    }
    catch (error) {
        console.error('Erreur:', error);
    }
});
console.log("MainApp");
MainApp.init();
