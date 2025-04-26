import { renderLibrary } from "./libraryRenderer.js";
import { LoginManager } from "../../managers/loginManager.js";

export async function setupLibrary(): Promise<void> {
  if (!await LoginManager.isLoggedIn()) {
    console.log("Not logged in, showing login modal");
    LoginManager.showLoginModal();
    return;
  }
  console.log("Logged in, rendering library");

  const searchBar = document.getElementById("searchBar") as HTMLInputElement;
  searchBar.addEventListener("input", () => renderLibrary(searchBar.value.toLowerCase()));

  // Initial render
  renderLibrary("");
}
