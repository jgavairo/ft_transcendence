import { HOSTNAME } from "../../main.js";
import { showErrorNotification } from "../../helpers/notifications.js";
// Fonction pour gérer le succès de l'authentification Google
async function handleGoogleAuthSuccess() {
    try {
        // Vérifier que l'utilisateur est bien connecté
        const response = await fetch(`https://${HOSTNAME}:8443/api/auth/check`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            // Reproduire le comportement du login normal
            const modal = document.getElementById('optionnalModal');
            if (modal) {
                modal.innerHTML = '';
            }
            // Importer et appeler les fonctions nécessaires
            const { MainApp, updateChatWidgetVisibility } = await import('../../main.js');
            const { setupProfileButton } = await import('../../header/navigation.js');
            MainApp.setupHeader();
            MainApp.setupCurrentPage(true);
            setupProfileButton();
            updateChatWidgetVisibility();
        }
        else {
            showErrorNotification('Erreur lors de la vérification de l\'authentification');
        }
    }
    catch (error) {
        console.error('Error handling Google auth success:', error);
        showErrorNotification('Erreur lors de la connexion');
    }
}
export async function googleSignInHandler() {
    // Calculer la position pour centrer la popup
    const popupWidth = 500;
    const popupHeight = 600;
    const left = (window.screen.width - popupWidth) / 2;
    const top = (window.screen.height - popupHeight) / 2;
    const popup = window.open(`https://${HOSTNAME}:8443/api/auth/google`, 'googleAuth', `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no`);
    if (!popup) {
        showErrorNotification('Le navigateur a bloqué la popup. Veuillez autoriser les popups pour ce site.');
        return;
    }
    // Écouter les messages de la popup
    const handleMessage = (event) => {
        if (event.origin !== `https://${HOSTNAME}:8443`) {
            return;
        }
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            popup.close();
            window.removeEventListener('message', handleMessage);
            // Gérer le succès de l'authentification
            handleGoogleAuthSuccess();
        }
        else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', handleMessage);
            showErrorNotification(event.data.message || 'Erreur lors de l\'authentification Google');
        }
    };
    window.addEventListener('message', handleMessage);
    // Vérifier si la popup a été fermée manuellement
    const checkClosed = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
        }
    }, 1000);
}
