export function renderLoginPage(): void {
    const app = document.getElementById('app');
    if (!app) return;

    // Injecter le HTML de la page de login
    app.innerHTML = `
        <div class="login-container">
            <h1>ft_transcendence</h1>
            <form id="loginForm">
                <input type="text" id="username" placeholder="Username">
                <input type="password" id="password" placeholder="Password">
                <button type="submit">Se connecter</button>
            </form>
        </div>
    `;

    // Ajouter les écouteurs d'événements
    const form = document.getElementById('loginForm');
    form?.addEventListener('submit', handleLogin);
}

function handleLogin(event: Event): void {
    event.preventDefault();
    // Logique de connexion à implémenter
}