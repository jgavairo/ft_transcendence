var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { profileModalHTML, uploadPictureFormHTML, changePasswordModalHTML } from '../scripts/sourcepage.js';
import { MainApp } from './main.js';
import api from './api.js';
import { showErrorNotification, showNotification } from './notifications.js';
export function setupProfileModal() {
    return __awaiter(this, void 0, void 0, function* () {
        const modal = document.getElementById('optionnalModal');
        if (!modal)
            return;
        const userInfos = yield MainApp.getUserInfo();
        const profilePictureWithTimestamp = `${userInfos.profile_picture}?t=${Date.now()}`;
        modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, profilePictureWithTimestamp, userInfos.bio || '');
        const closeButton = document.getElementById('closeProfileModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.innerHTML = ''; // Vide complètement le contenu de la modal
            });
        }
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) { // Vérifie que le clic est sur l'overlay
                    modal.innerHTML = ''; // Vide complètement le contenu de la modal
                }
            });
        }
        const changeProfilePictureButton = document.getElementById('changeProfilePictureButton');
        if (changeProfilePictureButton) {
            changeProfilePictureButton.addEventListener('click', () => {
                setupChangeProfilePictureModal();
            });
        }
        const changePasswordButton = document.getElementById('changePasswordButton');
        if (changePasswordButton) {
            changePasswordButton.addEventListener('click', () => {
                changePassword();
            });
        }
        const saveBioButton = document.getElementById('saveBioButton');
        const bioInput = document.getElementById('bioInput');
        if (saveBioButton && bioInput) {
            saveBioButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                const newBio = bioInput.value.trim();
                if (newBio.length > 150) {
                    showErrorNotification('Bio must be 150 characters or less.');
                    return;
                }
                try {
                    const response = yield api.post('http://127.0.0.1:3000/api/profile/updateBio', { bio: newBio });
                    const data = yield response.json();
                    if (data.success) {
                        showNotification('Bio updated successfully.');
                        userInfos.bio = newBio; // Met à jour localement
                    }
                    else {
                        showErrorNotification(data.message);
                    }
                }
                catch (error) {
                    console.error('Error updating bio:', error);
                    showErrorNotification('Failed to update bio.');
                }
            }));
        }
    });
}
function changePassword() {
    console.log('changePassword');
    const modal = document.getElementById('profile-modal');
    if (!modal)
        return;
    modal.innerHTML = changePasswordModalHTML;
    const closeButton = document.getElementById('closeModal');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        setupProfileModal();
    });
    const sendNewPasswordButton = document.getElementById('changePasswordButton');
    if (!sendNewPasswordButton)
        return;
    sendNewPasswordButton.addEventListener('click', () => {
        console.log('sendNewPasswordButton clicked');
    });
}
function setupChangeProfilePictureModal() {
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal)
        return;
    profileModal.innerHTML = uploadPictureFormHTML;
    // Gestionnaire pour la croix (ferme complètement la fenêtre)
    const closeButton = document.getElementById('closeModal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            const modal = document.getElementById('optionnalModal');
            if (modal) {
                modal.innerHTML = ''; // Vide complètement le contenu de la modal
            }
        });
    }
    // Gestionnaire pour la flèche "Back" (revient aux Profile Settings)
    const backArrow = document.getElementById('backToProfileSettings');
    if (backArrow) {
        backArrow.addEventListener('click', () => {
            setupProfileModal(); // Retourne aux Profile Settings
        });
    }
    const submitButton = document.getElementById('sendPictureButton');
    if (!submitButton)
        return;
    const newPictureInput = document.getElementById('pictureUploader');
    if (!newPictureInput)
        return;
    submitButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const newPicture = (_a = newPictureInput.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!newPicture)
            return;
        try {
            const formData = new FormData();
            formData.append('newPicture', newPicture);
            const response = yield api.postFormData('http://127.0.0.1:3000/api/profile/changePicture', formData);
            const data = yield response.json();
            if (data.success) {
                console.log('Picture changed');
                showNotification('Picture changed');
                const headerPP = document.getElementById('profilePicture');
                if (!headerPP)
                    return;
                headerPP.src = `${data.profile_picture}?t=${Date.now()}`;
                yield setupProfileModal();
            }
            else {
                console.error('Failed to change picture');
                console.error(data.message);
                showErrorNotification('Failed to change picture');
            }
        }
        catch (error) {
            console.error('Error changing picture:', error);
            showErrorNotification('Error changing picture');
        }
    }));
}
