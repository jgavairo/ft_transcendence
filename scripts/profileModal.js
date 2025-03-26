import { profileModalHTML } from '../scripts/sourcepage.js';
export function setupProfileModal() {
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    modal.innerHTML = profileModalHTML;
    const closeButton = document.getElementById('closeProfileModal');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        modal.innerHTML = '';
    });
}
