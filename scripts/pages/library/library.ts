import { renderLibrary } from "./libraryRenderer.js";
import { LoginManager } from "../../managers/loginManager.js";

export async function setupLibrary(): Promise<void> {
  if (!await LoginManager.isLoggedIn()) {
    LoginManager.showLoginModal();
    return;
  }

  const searchBar = document.getElementById("searchBar") as HTMLInputElement;
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
    searchBar.addEventListener("paste", (e: ClipboardEvent) => {
      e.preventDefault();
      const pastedText = e.clipboardData?.getData('text') || '';
      if (pastedText.length > 15) {
        searchBar.value = pastedText.slice(0, 15);
      } else {
        searchBar.value = pastedText;
      }
      renderLibrary(searchBar.value.toLowerCase());
    });
  }

  // Initial render
  renderLibrary("");
}
