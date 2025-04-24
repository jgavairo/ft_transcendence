var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { showNotification } from "../../helpers/notifications.js";
import { UserLibraryManager } from "../../managers/userLibrary.js";
import { GameManager } from "../../managers/gameManager.js";
export function setupBuyButtons() {
    const buyButtons = document.querySelectorAll('.buybutton');
    if (!buyButtons) {
        console.error('Buy buttons not found');
        return;
    }
    buyButtons.forEach((button) => __awaiter(this, void 0, void 0, function* () {
        button.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log("BUY BUTTON CLICKED");
            const gameList = yield GameManager.getGameList();
            const gameCard = e.target.closest('.gamecard');
            if (!gameCard)
                return;
            const gameId = (_a = gameList.find(g => g.name + 'card' === gameCard.id)) === null || _a === void 0 ? void 0 : _a.id;
            if (gameId === undefined)
                return;
            // Ajoute le jeu à la bibliothèque
            yield UserLibraryManager.addGame(gameId);
            console.log("IN SETUP BUY BUTTON CLICKED");
            // Met à jour l'apparence du bouton
            const button = e.target;
            button.textContent = 'Already in library';
            button.classList.replace('buybutton', 'owned-button');
            button.disabled = true;
            // Affiche une notification
            showNotification('Game added to your library!');
        }));
    }));
}
