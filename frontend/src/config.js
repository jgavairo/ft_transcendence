// Configuration de l'application
const config = {
    // URL du backend
    backendUrl: 'http://z1r2p4.42lyon.fr:3000',
    
    // URL du frontend
    frontendUrl: 'http://z1r2p4.42lyon.fr:8080',
    
    // Configuration des cookies
    cookieOptions: {
        path: '/',
        domain: '.42lyon.fr',
        secure: false,
        sameSite: 'lax'
    }
};

export default config; 