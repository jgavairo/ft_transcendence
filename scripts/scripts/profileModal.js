var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { profileModalHTML } from '../scripts/sourcepage.js';
import { MainApp } from './main.js';
export function setupProfileModal() {
    return __awaiter(this, void 0, void 0, function* () {
        const modal = document.getElementById('optionnalModal');
        if (!modal)
            return;
        const userInfos = yield MainApp.getUserInfo();
        modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, userInfos.profile_picture);
        const closeButton = document.getElementById('closeProfileModal');
        if (!closeButton)
            return;
        closeButton.addEventListener('click', () => {
            modal.innerHTML = '';
        });
    });
}
