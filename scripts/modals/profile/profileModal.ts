import {profileModalHTML, uploadPictureFormHTML, changePasswordModalHTML} from '../../sourcepage.js'
import { MainApp } from '../../main.js'
import api from '../../helpers/api.js'
import { showErrorNotification, showNotification } from '../../helpers/notifications.js';


export async function setupProfileModal() {
    const modal = document.getElementById('optionnalModal');
    if (!modal) return;

    const userInfos = await MainApp.getUserInfo();
    const profilePictureWithTimestamp = `${userInfos.profile_picture}?t=${Date.now()}`;
    modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, profilePictureWithTimestamp, userInfos.bio || '');

    const closeButton = document.getElementById('closeProfileModal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.innerHTML = '';
        });
    }

    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                modal.innerHTML = '';
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
    const bioInput = document.getElementById('bioInput') as HTMLTextAreaElement;
    if (saveBioButton && bioInput) {
        saveBioButton.addEventListener('click', async () => {
            const newBio = bioInput.value.trim();
            if (newBio.length > 150) {
                showErrorNotification('Bio must be 150 characters or less.');
                return;
            }
            try {
                const response = await api.post('http://127.0.0.1:3000/api/profile/updateBio', { bio: newBio });
                const data = await response.json();
                if (data.success) {
                    showNotification('Bio updated successfully.');
                    userInfos.bio = newBio; // Met à jour localement
                } else {
                    showErrorNotification(data.message);
                }
            } catch (error) {
                console.error('Error updating bio:', error);
                showErrorNotification('Failed to update bio.');
            }
        });
    }
}

function changePassword()
{
    console.log('changePassword');
    const modal = document.getElementById('profile-modal');
    if (!modal)
        return;
    modal.innerHTML = changePasswordModalHTML;
    const closeButton = document.getElementById('backToProfileSettings');
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
    if (!profileModal) return;

    profileModal.innerHTML = uploadPictureFormHTML;

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

    const newPictureInput = document.getElementById('pictureUploader') as HTMLInputElement;
    if (!newPictureInput)
        return;

    submitButton.addEventListener('click', async () => {
        const newPicture = newPictureInput.files?.[0];
        if (!newPicture) 
        {
            showErrorNotification('No picture selected');
            return;
        }

        const formData = new FormData();
        formData.append('picture', newPicture);

        try
        {
            const response = await api.postFormData('http://127.0.0.1:3000/api/profile/changePicture', formData);
            const data = await response.json();
            if (data.success)
            {
                showNotification('Profile picture updated successfully.');
                setupProfileModal();
            }
            else
            {
                showErrorNotification(data.message || 'Failed to update profile picture');
            }
        }
        catch (error)
        {
            console.error('Error changing profile picture:', error);
            showErrorNotification('Failed to change profile picture.');
        }

        showNotification('Picture Button Clicked');
        
    });
}
