var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LoginManager } from '../../managers/loginManager.js';
import { communityPage } from '../../sourcepage.js';
import { renderPeopleList, setupSearchInput } from '../community/peopleList.js';
import { setupChat } from '../community/chat.js';
export function showCommunityPage() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield LoginManager.isLoggedIn())) {
            console.log("Not logged in, showing login modal");
            LoginManager.showLoginModal();
            return;
        }
        else {
            console.log("Logged in, showing community");
        }
        const main = document.getElementById("main");
        if (!main)
            return;
        main.innerHTML = communityPage;
        renderPeopleList();
        setupSearchInput();
        setupChat();
    });
}
