import {profileModalHTML, uploadPictureFormHTML, changePasswordModalHTML} from '../scripts/sourcepage.js'
import { MainApp } from './main.js'
import api from './api.js'
import { showErrorNotification, showNotification } from './notifications.js';
import { UserLibraryManager } from './userLibrary.js';
export async function setupProfileModal()
{
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    const userInfos = await MainApp.getUserInfo();
    const profilePictureWithTimestamp = `${userInfos.profile_picture}?t=${Date.now()}`;
    modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, profilePictureWithTimestamp);
    const closeButton = document.getElementById('closeProfileModal');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        modal.innerHTML = '';
    });

    const changeProfilePictureButton = document.getElementById('changeProfilePictureButton');
    if (!changeProfilePictureButton)
        return;
    changeProfilePictureButton.addEventListener('click', () => {
        setupChangeProfilePictureModal();
    });

    const changePasswordButton = document.getElementById('changePasswordButton');
    if (!changePasswordButton)
        return;
    changePasswordButton.addEventListener('click', () => {
        changePassword();
    });
}

function changePassword()
{
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

function setupChangeProfilePictureModal()
{
    const profileModal = document.getElementById('profile-modal');
        if (!profileModal)
            return;
    profileModal.innerHTML = uploadPictureFormHTML;
    const closeButton = document.getElementById('closeModal');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        setupProfileModal();
    });
    const submitButton = document.getElementById('sendPictureButton');
    if (!submitButton)
        return;
    const newPictureInput = document.getElementById('pictureUploader') as HTMLInputElement; 
    if (!newPictureInput)
        return;
    submitButton.addEventListener('click', async () => {
        const newPicture = newPictureInput.files?.[0];
        if (!newPicture)
            return;
        try
        {
            const formData = new FormData();
            formData.append('newPicture', newPicture);

            const response = await api.postFormData('http://127.0.0.1:3000/api/profile/changePicture', formData);
            const data = await response.json();
            if (data.success)
            {
                console.log('Picture changed');
                showNotification('Picture changed');
                const headerPP = document.getElementById('profilePicture') as HTMLImageElement;
                if (!headerPP)
                    return;
                headerPP.src = `${data.profile_picture}?t=${Date.now()}`;;
                await setupProfileModal();
            }
            else
            {
                console.error('Failed to change picture');
                console.error(data.message);
                showErrorNotification('Failed to change picture');
            }
        }
        catch (error)
        {
            console.error('Error changing picture:', error);
            showErrorNotification('Error changing picture');
        }
    });
}