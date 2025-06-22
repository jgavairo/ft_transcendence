import {profileModalHTML, uploadPictureFormHTML, changePasswordModalHTML, changeUsernameModalHTML, changeEmailModalHTML, changeDoubleAuthentificationModalHTML, disable2FAModalHTML} from '../../sourcepage.js'
import { MainApp, HOSTNAME } from '../../main.js'
import api from '../../helpers/api.js'
import { showErrorNotification, showNotification } from '../../helpers/notifications.js';

// Fonction pour ajouter un timestamp aux URLs d'images
const getImageUrl = (imagePath: string | null, username: string) => {
    if (!imagePath || imagePath === 'default-profile.png') {
        return 'default-profile.png';
    }
    // Ajouter un timestamp pour forcer le rechargement
    const timestamp = Date.now();
    return `${imagePath}?v=${timestamp}&user=${username}`;
};

export async function setupProfileModal() {
    const modal = document.getElementById('optionnalModal');
    if (!modal) return;

    const userInfos = await MainApp.getUserInfo();
    const profilePictureWithTimestamp = getImageUrl(userInfos.profile_picture, userInfos.username);
    modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, profilePictureWithTimestamp, userInfos.bio || '', userInfos.two_factor_enabled, userInfos.is_google_account);

    const closeButton = document.getElementById('closeProfileModal');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.innerHTML = '';
        });
    }

    const overlay = document.getElementById('modalOverlay');
    if (overlay) 
    {
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
    const bioInput = document.getElementById('bioInput') as HTMLTextAreaElement;
    if (saveBioButton && bioInput) {
        bioInput.addEventListener('keypress', async (e: Event) => {
            const keyEvent = e as KeyboardEvent;
            if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
                e.preventDefault();
                saveBioButton.click();
            }
        });

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
                else
                {
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
    const passwordForm = document.querySelector('.changePassword-modal-content');
    if (!sendNewPasswordButton || !passwordForm)
        return;

    passwordForm.addEventListener('keypress', async (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter') {
            e.preventDefault();
            sendNewPasswordButton.click();
        }
    });

    sendNewPasswordButton.addEventListener('click', async () => {
        const oldPassword = document.getElementById('oldPassword') as HTMLInputElement;
        const newPassword = document.getElementById('newPassword') as HTMLInputElement;
        const confirmNewPassword = document.getElementById('confirmNewPassword') as HTMLInputElement;
        if (!oldPassword || !newPassword || !confirmNewPassword)
        {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (newPassword.value !== confirmNewPassword.value)
        {
            showErrorNotification('New password and confirm new password do not match');
            return;
        }
        if (oldPassword.value === newPassword.value)
        {
            showErrorNotification('New password and old password cannot be the same');
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,25}$/;
        if (!passwordRegex.test(newPassword.value) || !passwordRegex.test(oldPassword.value))
        {
            showErrorNotification('Password must be between 8 and 25 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%#*?&)');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/changePassword`, 
        {
            oldPassword: oldPassword.value,
            newPassword: newPassword.value
        });
        const data = await response.json();
        if (data.success)
        {
            showNotification('Password updated successfully.');
            setupProfileModal();
        }
        else
        {
            showErrorNotification(data.message);
        }
    });
}
function setupChangeProfilePictureModal() 
{
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

    const newPictureInput = document.getElementById('pictureUploader') as HTMLInputElement;
    if (!newPictureInput)
        return;

    // Validation côté client
    const validateImageFile = (file: File): boolean => {
        // Vérifier le type MIME
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showErrorNotification('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
            return false;
        }

        // Vérifier la taille (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showErrorNotification('File size must be less than 5MB.');
            return false;
        }

        // Vérifier l'extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(fileExtension)) {
            showErrorNotification('Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp are allowed.');
            return false;
        }

        return true;
    };

    // Validation des dimensions d'image
    const validateImageDimensions = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                const maxWidth = 1920;
                const maxHeight = 1080;
                
                if (img.width > maxWidth || img.height > maxHeight) {
                    showErrorNotification(`Image dimensions must be less than ${maxWidth}x${maxHeight} pixels.`);
                    resolve(false);
                } else if (img.width <= 0 || img.height <= 0) {
                    showErrorNotification('Invalid image dimensions.');
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                showErrorNotification('Could not load image. Please try another file.');
                resolve(false);
            };
            
            img.src = url;
        });
    };

    submitButton.addEventListener('click', async () => {
        const newPicture = newPictureInput.files?.[0];
        if (!newPicture) 
        {
            showErrorNotification('No picture selected');
            return;
        }

        // Validation côté client
        if (!validateImageFile(newPicture)) {
            return;
        }

        // Validation des dimensions
        const isValidDimensions = await validateImageDimensions(newPicture);
        if (!isValidDimensions) {
            return;
        }

        const formData = new FormData();
        formData.append('picture', newPicture);

        try
        {
            const response = await api.postFormData(`https://${HOSTNAME}:8443/api/profile/changePicture`, formData);
            const data = await response.json();
            if (data.success)
            {
                showNotification('Profile picture updated successfully.');
                const timestamp = Date.now();
                const newImagePath = `${data.path}?t=${timestamp}`;

                const headerProfilePicture = document.querySelector('.profile .profilePicture') as HTMLImageElement;
                if (headerProfilePicture) {
                    headerProfilePicture.src = newImagePath;
                }

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
    });
}



function changeUsername()
{
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
    const usernameForm = document.querySelector('.changePassword-modal-content');
    if (!sendNewUsernameButton || !usernameForm)
        return;

    usernameForm.addEventListener('keypress', async (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter') {
            e.preventDefault();
            sendNewUsernameButton.click();
        }
    });

    sendNewUsernameButton.addEventListener('click', async () => {
        const newUsername = document.getElementById('newUsername') as HTMLInputElement;
        if (!newUsername)
        {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (newUsername.value === '')
        {
            showErrorNotification('New username cannot be empty');
            return;
        }
        const usernameRegex = /^[a-zA-Z0-9_-]{5,20}$/;
        if (!usernameRegex.test(newUsername.value))
        {
            showErrorNotification('Username must be between 5 and 20 characters and can only contain letters, numbers, underscores and hyphens');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/changeUsername`, 
        {
            newUsername: newUsername.value
        });
        const data = await response.json();
        if (data.success)
        {
            showNotification('Username updated successfully.');
            setupProfileModal();
            const headerProfileButton = document.querySelector('.profileName') as HTMLSpanElement;
            if (headerProfileButton)
            {
                headerProfileButton.textContent = newUsername.value;
            }
        }
        else
        {
            showErrorNotification(data.message);
        }
    });
}

function changeEmail()
{
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
    const emailForm = document.querySelector('.changePassword-modal-content');
    if (!sendNewEmailButton || !emailForm)
        return;

    emailForm.addEventListener('keypress', async (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter') {
            e.preventDefault();
            sendNewEmailButton.click();
        }
    });

    sendNewEmailButton.addEventListener('click', async () => {
        const newEmail = document.getElementById('newEmail') as HTMLInputElement;
        if (!newEmail)
        {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (newEmail.value === '')
        {
            showErrorNotification('New email cannot be empty');
            return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]{1,30}@[a-zA-Z0-9.-]{1,30}\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(newEmail.value))
        {
            showErrorNotification('Please enter a valid email address');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/changeEmail`, 
        {
            newEmail: newEmail.value
        });
        const data = await response.json();
        if (data.success)
        {
            showNotification('Email updated successfully.');
            setupProfileModal();
        }
        else
        {
            showErrorNotification(data.message);
        }
    });
}

async function disable2FA()
{
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
    const disable2FAForm = document.querySelector('.changePassword-modal-content');
    if (!disable2FAButton || !disable2FAForm)
        return;

    disable2FAForm.addEventListener('keypress', async (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter') {
            e.preventDefault();
            disable2FAButton.click();
        }
    });

    disable2FAButton.addEventListener('click', async () => {
        const password = document.getElementById('password') as HTMLInputElement;
        if (!password)
        {
            showErrorNotification('Please fill in all fields');
            return;
        }
        if (password.value === '')
        {
            showErrorNotification('Password cannot be empty');
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,25}$/;
        if (!passwordRegex.test(password.value))
        {
            showErrorNotification('Invalid password');
            return;
        }
        const response = await api.post(`https://${HOSTNAME}:8443/api/user/disable2FA`, 
        {
            password: password.value
        });
        const data = await response.json();
        if (data.success)
        {
            showNotification('2FA disabled successfully.');
            setupProfileModal();
        }
        else
        {
            showErrorNotification(data.message);
        }
    });
}

async function changeDoubleAuthentification()
{
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
    if (data.success)
    {
        showNotification('2FA code sent successfully, check your mailbox.');
        const enableDoubleAuthentificationButton = document.getElementById('changeDoubleAuthentificationButton');
        const doubleAuthForm = document.querySelector('.changeDoubleAuthentification-modal-content');
        if (!enableDoubleAuthentificationButton || !doubleAuthForm)
            return;

        doubleAuthForm.addEventListener('keypress', async (e: Event) => {
            const keyEvent = e as KeyboardEvent;
            if (keyEvent.key === 'Enter') {
                e.preventDefault();
                enableDoubleAuthentificationButton.click();
            }
        });

        enableDoubleAuthentificationButton.addEventListener('click', async () => {
            const code = document.getElementById('code') as HTMLInputElement;
            if (!code)
                return;
            const codeRegex = /^[0-9]{6}$/;
            if (!codeRegex.test(code.value))
            {
                showErrorNotification('Invalid code');
                return;
            }
            const response = await api.post(`https://${HOSTNAME}:8443/api/user/enable2FA`, 
            {
                code: code.value
            });
            const data = await response.json();
            if (data.success)
            {
                showNotification('2FA enabled successfully.');
                setupProfileModal();
            }
            else
                showErrorNotification(data.message);
        });
    }
    else
    {
        showErrorNotification(data.message);
    }
}
