import { launchPong } from "./pong/main.js";
import { renderLibrary } from "../pages/library/libraryRenderer.js";

// Fonction d'initialisation pour la page library
export function setupLibrary() {
    // Appelle renderLibrary avec une chaîne vide pour afficher toute la bibliothèque
    renderLibrary("");
    // Ajoute un listener sur la barre de recherche si besoin :
    const searchBar = document.getElementById("searchBar") as HTMLInputElement;
    if (searchBar) {
        searchBar.addEventListener("input", () => {
            renderLibrary(searchBar.value.toLowerCase());
        });
    }
}