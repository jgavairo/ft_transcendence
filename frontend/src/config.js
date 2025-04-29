// Configuration de l'application
const config = {
    // URL du backend
    backendUrl: 'http://z3r5p2.42lyon.fr:3000',
    
    // URL du frontend
    frontendUrl: 'http://z3r5p2.42lyon.fr:8080',
    
    // Configuration des cookies
    cookieOptions: {
        path: '/',
        domain: '.42lyon.fr',
        secure: false,
        sameSite: 'lax'
    }
};

export default config; 