// Import des fonctions de rendu de chaque page
import { renderStore } from './pages/Store/store';
import { renderLibrary } from './pages/Library/library';
import { renderCommunity } from './pages/Community/community';
import { navigateTo } from './route';
import { initializeRouter } from './route';


type pageName = 'STORE' | 'LIBRARY' | 'COMMUNITY';
// Cette fonction crée la structure HTML de base pour toutes les pages
// Elle prend en paramètre la page active (STORE, LIBRARY ou COMMUNITY)
function createBasePage(activePage: pageName): string
{
	return `
        <nav class="nav-header">
            <a href="/store" 
               class="nav-${activePage === 'STORE' ? 'logo' : 'link'}" 
               data-page="STORE">STORE</a>
            <a href="/library" 
               class="nav-${activePage === 'LIBRARY' ? 'logo' : 'link'}" 
               data-page="LIBRARY">LIBRARY</a>
            <a href="/community" 
               class="nav-${activePage === 'COMMUNITY' ? 'logo' : 'link'}" 
               data-page="COMMUNITY">COMMUNITY</a>
        </nav>
        ${activePage}
    `;
}

//fonction pour changer de page
export function changePage(page: pageName): void
{
	const app = document.getElementById('app');
	if (!app)
		return;
	
	app.innerHTML = createBasePage(page);

	attachNavigationListeners();

	switch (page)
	{
		case 'STORE':
			renderStore();
			break;
		case 'LIBRARY':
			renderLibrary();
			break;
		case 'COMMUNITY':
			renderCommunity();
			break;
	}
}

function attachNavigationListeners(): void
{
	const navlinks = document.querySelectorAll('.nav-header a');
	navlinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const page = (e.target as HTMLElement).getAttribute('data-page') as pageName;
			navigateTo(page);
		})
	})
}



// Modification de l'initialisation
export function initializeNavigation(): void {
    initializeRouter(); // Initialise le router au lieu de changePage
}

