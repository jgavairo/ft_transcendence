import '../../styles/community.css';

export function renderCommunity(): void {
    const contentSection = document.querySelector('.content-grid');
    if (!contentSection) return;

    contentSection.innerHTML = `
        <h1></h1>
        <div class="content-grid">
            <!-- Le contenu de la communauté sera ajouté ici -->
        </div>
    `;
}
