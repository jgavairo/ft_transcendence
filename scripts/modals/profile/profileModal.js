import { profileModalHTML, uploadPictureFormHTML, changePasswordModalHTML, changeUsernameModalHTML, changeEmailModalHTML, changeDoubleAuthentificationModalHTML, disable2FAModalHTML } from '../../sourcepage.js';
import { MainApp, HOSTNAME } from '../../main.js';
import api from '../../helpers/api.js';
import { showErrorNotification, showNotification } from '../../helpers/notifications.js';
export async function setupProfileModal() {
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    const userInfos = await MainApp.getUserInfo();
    const profilePictureWithTimestamp = `${userInfos.profile_picture}?t=${Date.now()}`;
    modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, profilePictureWithTimestamp, userInfos.bio || '', userInfos.two_factor_enabled, userInfos.is_google_account);
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
    const changeUsernameButton = document.getElementById('changeUsernameButton');
    if (changeUsernameButton) {
        changeUsernameButton.addEventListener('click', () => {
            changeUsername();
        });
    }
    const changeEmailButton = document.getElementById('changeEmailButton');
    if (changeEmailButton) {
        changeEmailButton.addEventListener('click', () => {
            changeEmail();
        });
    }
    const changeDoubleAuthentificationButton = document.getElementById('enable2FAButton');
    if (changeDoubleAuthentificationButton) {
        changeDoubleAuthentificationButton.addEventListener('click', () => {
            changeDoubleAuthentification();
        });
    }
    const disable2FAButton = document.getElementById('disable2FAButton');
    if (disable2FAButton) {
        disable2FAButton.addEventListener('click', () => {
            disable2FA();
        });
    }
    const saveBioButton = document.getElementById('saveBioButton');
    const bioInput = document.getElementById('bioInput');
    if (saveBioButton && bioInput) {
        saveBioButton.addEventListener('click', async () => {
            const newBio = bioInput.value.trim();
            if (newBio.length > 150) {
                showErrorNotification('Bio must be 150 characters or less.');
                return;
            }
            try {
                const response = await api.post(`https://${HOSTNAME}:8443/api/profile/updateBio`, { bio: newBio });
                const data = await response.json();
                if (data.success) {
                    showNotification('Bio updated successfully.');
                    userInfos.bio = newBio;
                }
                else {
                    showErrorNotification(data.message);
                }
            }
            catch (error) {
                console.error('Error updating bio:', error);
                showErrorNotification('Failed to update bio.');
            }
        });
    }
}
function changePassword() {
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
    sendNewPasswordButton.addEventListener('click', async () => {
        console.log('sendNewPasswordButton clicked');
        const oldPassword = document.getElementById('oldPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmNewPassword = document.getElementById('confirmNewPassword');
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (newPassword.value !== confirmNewPassword.value) {
            showErrorNotification('New password and confirm new password do not match');
            return;
        }
        if (oldPassword.value === newPassword.value) {
            showErrorNotification('New password and old password cannot be the same');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/changePassword`, {
            oldPassword: oldPassword.value,
            newPassword: newPassword.value
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Password updated successfully.');
            setupProfileModal();
        }
        else {
            showErrorNotification(data.message);
        }
    });
}
function setupChangeProfilePictureModal() {
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal)
        return;
    profileModal.innerHTML = uploadPictureFormHTML;
    // Gestionnaire pour la flèche "Back" (revient aux Profile Settings)
    const backArrow = document.getElementById('backToProfileSettings');
    if (backArrow) {
        backArrow.addEventListener('click', () => {
            setupProfileModal();
        });
    }
    const submitButton = document.getElementById('sendPictureButton');
    if (!submitButton)
        return;
    const newPictureInput = document.getElementById('pictureUploader');
    if (!newPictureInput)
        return;
    submitButton.addEventListener('click', async () => {
        var _a;
        const newPicture = (_a = newPictureInput.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!newPicture) {
            showErrorNotification('No picture selected');
            return;
        }
        const formData = new FormData();
        formData.append('picture', newPicture);
        try {
            const response = await api.postFormData(`https://${HOSTNAME}:8443/api/profile/changePicture`, formData);
            const data = await response.json();
            if (data.success) {
                showNotification('Profile picture updated successfully.');
                const timestamp = Date.now();
                const newImagePath = `${data.path}?t=${timestamp}`;
                const headerProfilePicture = document.querySelector('.profile .profilePicture');
                if (headerProfilePicture) {
                    headerProfilePicture.src = newImagePath;
                }
                setupProfileModal();
            }
            else {
                showErrorNotification(data.message || 'Failed to update profile picture');
            }
        }
        catch (error) {
            console.error('Error changing profile picture:', error);
            showErrorNotification('Failed to change profile picture.');
        }
    });
}
function isValidUsername(username) {
    const usernameRegex = /^(?=.{3,20}$)(?!.*[_.-]{2})[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;
    return usernameRegex.test(username);
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function changeUsername() {
    console.log('changeUsername');
    const modal = document.getElementById('profile-modal');
    if (!modal)
        return;
    modal.innerHTML = changeUsernameModalHTML;
    const closeButton = document.getElementById('backToProfileSettings');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        setupProfileModal();
    });
    const sendNewUsernameButton = document.getElementById('changeUsernameButton');
    if (!sendNewUsernameButton)
        return;
    sendNewUsernameButton.addEventListener('click', async () => {
        console.log('sendNewUsernameButton clicked');
        const newUsername = document.getElementById('newUsername');
        if (!newUsername) {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (newUsername.value === '') {
            showErrorNotification('New username cannot be empty');
            return;
        }
        if (!isValidUsername(newUsername.value)) {
            showErrorNotification('Invalid username');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/changeUsername`, {
            newUsername: newUsername.value
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Username updated successfully.');
            setupProfileModal();
            const headerProfileButton = document.querySelector('.profileName');
            if (headerProfileButton) {
                headerProfileButton.textContent = newUsername.value;
            }
        }
        else {
            showErrorNotification(data.message);
        }
    });
}
function changeEmail() {
    console.log('changeEmail');
    const modal = document.getElementById('profile-modal');
    if (!modal)
        return;
    modal.innerHTML = changeEmailModalHTML;
    const closeButton = document.getElementById('backToProfileSettings');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        setupProfileModal();
    });
    const sendNewEmailButton = document.getElementById('changeEmailButton');
    if (!sendNewEmailButton)
        return;
    sendNewEmailButton.addEventListener('click', async () => {
        console.log('sendNewEmailButton clicked');
        const newEmail = document.getElementById('newEmail');
        if (!newEmail) {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (newEmail.value === '') {
            showErrorNotification('New email cannot be empty');
            return;
        }
        if (!isValidEmail(newEmail.value)) {
            showErrorNotification('Invalid email');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/changeEmail`, {
            newEmail: newEmail.value
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Email updated successfully.');
            setupProfileModal();
        }
        else {
            showErrorNotification(data.message);
        }
    });
}
async function disable2FA() {
    console.log('disable2FA');
    const modal = document.getElementById('profile-modal');
    if (!modal)
        return;
    modal.innerHTML = disable2FAModalHTML;
    const closeButton = document.getElementById('backToProfileSettings');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        setupProfileModal();
    });
    const disable2FAButton = document.getElementById('disable2FAButton');
    if (!disable2FAButton)
        return;
    disable2FAButton.addEventListener('click', async () => {
        console.log('disable2FAButton clicked');
        const password = document.getElementById('password');
        if (!password) {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (password.value === '') {
            showErrorNotification('Password cannot be empty');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/disable2FA`, {
            password: password.value
        });
        const data = await response.json();
        if (data.success) {
            showNotification('2FA disabled successfully.');
            setupProfileModal();
        }
        else {
            showErrorNotification(data.message);
        }
    });
}
async function changeDoubleAuthentification() {
    console.log('changeDoubleAuthentification');
    const modal = document.getElementById('profile-modal');
    if (!modal)
        return;
    modal.innerHTML = changeDoubleAuthentificationModalHTML;
    const closeButton = document.getElementById('backToProfileSettings');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        setupProfileModal();
    });
    const response = await api.get(`https://${HOSTNAME}:8443/api/user/send2FACode`);
    const data = await response.json();
    if (data.success) {
        showNotification('2FA code sent successfully, check your mailbox.');
        const enableDoubleAuthentificationButton = document.getElementById('changeDoubleAuthentificationButton');
        if (!enableDoubleAuthentificationButton)
            return;
        enableDoubleAuthentificationButton.addEventListener('click', async () => {
            console.log('enableDoubleAuthentificationButton clicked');
            const code = document.getElementById('code');
            if (!code)
                return;
            const response = await api.post(`https://${HOSTNAME}:8443/api/user/enable2FA`, {
                code: code.value
            });
            const data = await response.json();
            if (data.success) {
                showNotification('2FA enabled successfully.');
                setupProfileModal();
            }
            else
                showErrorNotification(data.message);
        });
    }
    else {
        showErrorNotification(data.message);
    }
}
