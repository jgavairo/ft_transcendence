import { renderLibrary } from "./libraryRenderer.js";
import { LoginManager } from "../../managers/loginManager.js";
export async function setupLibrary() {
    if (!await LoginManager.isLoggedIn()) {
        LoginManager.showLoginModal();
        return;
    }
    const searchBar = document.getElementById("searchBar");
    if (searchBar) {
        searchBar.maxLength = 15;
        searchBar.addEventListener("input", () => {
            if (searchBar.value.length > 15) {
                searchBar.value = searchBar.value.slice(0, 15);
            }
            renderLibrary(searchBar.value.toLowerCase());
        });
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
    renderLibrary("");
}
