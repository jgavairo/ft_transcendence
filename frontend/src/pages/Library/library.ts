import '../../styles/library.css';

export function renderLibrary(): void {
    const contentSection = document.querySelector('.content-grid');
    if (!contentSection) return;

    contentSection.innerHTML = `
        <h1></h1>
        <div class="library-grid">
            <!-- Le contenu de la bibliothèque sera ajouté ici -->
        </div>
    `;
}
