import { changePage } from './navigation';

type Route = 
{
	path: string;
	page: 'STORE' | 'LIBRARY' | 'COMMUNITY';
	subPage?: string;
}

const routes: Route[] = [
	{ path: '/', page: 'STORE' },
	{ path: '/store', page: 'STORE' },
	{ path: '/library', page: 'LIBRARY' },
	{ path: '/community', page: 'COMMUNITY' },
];


export function navigateTo(page: Route['page']): void
{
    const route = routes.find(r => r.page === page);
    if (!route)
        return;

    // Vérifie si on est déjà sur cette page
    if (window.location.pathname === route.path)
        return;

    window.history.pushState({}, '', route.path);
	changePage(page);
}

export function initializeRouter(): void
{
	const path = window.location.pathname;
	
	// Si on est à la racine ou sur un chemin non reconnu, rediriger vers /store
	if (path === '/' || !routes.find(r => r.path === path)) {
		window.history.replaceState({}, '', '/store');
		changePage('STORE');
		return;
	}

	const route = routes.find(r => r.path === path) || routes[1]; // routes[1] est /store
	changePage(route.page);

	// Gestion du bouton retour du navigateur
    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        const route = routes.find(r => r.path === path) || routes[1];
        changePage(route.page);
    });
}