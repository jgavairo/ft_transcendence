import { renderLibrary } from "./libraryRenderer.js";
import { LoginManager } from "../../managers/loginManager.js";

export async function setupLibrary(): Promise<void> {
  if (!await LoginManager.isLoggedIn()) {
    LoginManager.showLoginModal();
    return;
  }

  const searchBar = document.getElementById("searchBar") as HTMLInputElement;
  if (searchBar) {
    searchBar.maxLength = 15;

    searchBar.addEventListener("input", () => {
      if (searchBar.value.length > 15) {
        searchBar.value = searchBar.value.slice(0, 15);
      }
      renderLibrary(searchBar.value.toLowerCase());
    });

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

  renderLibrary("");
}
