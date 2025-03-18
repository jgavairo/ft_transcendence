// Import des styles globaux
import './styles/global.css';

// Import de la navigation
import { initializeNavigation } from './navigation';

// Attend que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    // Initialise la navigation avec 'STORE' comme page par défaut
    initializeNavigation();
});