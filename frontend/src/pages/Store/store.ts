// Fichier spécifique à la page Store

// Importe les styles spécifiques au store
import '../../styles/store.css';

// Fonction de rendu du contenu spécifique au store
export function renderStore(): void {
    // Récupère le conteneur de contenu
    const contentSection = document.querySelector('.content-grid');
    if (!contentSection) return;

    // Injecte le contenu spécifique au store
    contentSection.innerHTML = `
        <h1></h1>
        <div class="games-grid">
            <!-- Contenu du store -->
        </div>
    `;
}