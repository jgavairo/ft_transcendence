import { renderLibrary } from "./libraryRenderer.js";
import { LoginManager } from "../../managers/loginManager.js";
export async function setupLibrary() {
    if (!await LoginManager.isLoggedIn()) {
        console.log("Not logged in, showing login modal");
        LoginManager.showLoginModal();
        return;
    }
    console.log("Logged in, rendering library");
    const searchBar = document.getElementById("searchBar");
    if (searchBar) {
        // Limite HTML
        searchBar.maxLength = 15;
        // Validation JavaScript
        searchBar.addEventListener("input", () => {
            // Limite la longueur à 15 caractères
            if (searchBar.value.length > 15) {
                searchBar.value = searchBar.value.slice(0, 15);
            }
            renderLibrary(searchBar.value.toLowerCase());
        });
        // Empêcher le copier-coller de texte trop long
        searchBar.addEventListener("paste", (e) => {
            var _a;
            e.preventDefault();
            const pastedText = ((_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text')) || '';
            if (pastedText.length > 15) {
                searchBar.value = pastedText.slice(0, 15);
            }
            else {
                searchBar.value = pastedText;
            }
            renderLibrary(searchBar.value.toLowerCase());
        });
    }
    // Initial render
    renderLibrary("");
}
