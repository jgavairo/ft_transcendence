// Gestion centralisée des liens d'invitation Pong pour chat et chat widget
import { showErrorNotification } from "./notifications.js";

export async function handlePongInviteLinkClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    if (target && target.tagName === 'A' && (target as HTMLAnchorElement).href && (target as HTMLAnchorElement).href.includes('/pong/join?room=')) {
        e.preventDefault();
        // Extraire l'ID de la room depuis l'URL
        const url = new URL((target as HTMLAnchorElement).href, window.location.origin);
        const roomId = url.searchParams.get('room');
        if (!roomId) return;
        // Vérifier si la room existe avant d'ouvrir le modal
        try {
            const resp = await fetch(`/api/pong/room-exists?roomId=${encodeURIComponent(roomId)}`, { credentials: "include" });
            const data = await resp.json();
            if (!data.success || !data.exists) {
                showErrorNotification && showErrorNotification("link expired");
                return;
            }
        } catch (err) {
            showErrorNotification && showErrorNotification("link expired");
            return;
        }
        // Charge la page library en arrière-plan pour éviter de garder community
        const libraryBtn = document.getElementById('librarybutton');
        if (libraryBtn) {
            libraryBtn.click();
            await new Promise(res => setTimeout(res, 100));
        }
        // Ouvre le modal de jeu façon overlay
        let modal = document.getElementById('optionnalModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'optionnalModal';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `
          <div class="modal-overlay" id="modalWindow">
            <div class="game-modal" id="games-modal"></div>
            <button class="close-modal" id="closeGameModal">&times;</button>
          </div>
        `;
        document.getElementById('closeGameModal')!.onclick = () => { modal!.innerHTML = ''; };
        // Appel la fonction centralisée pour lancer Pong via le lien
        // Utilise l'import relatif depuis le dossier scripts/pages/community/
        const { launchPongFromLink } = await import('../games/pong/main.js');
        launchPongFromLink(roomId);
    }
}
