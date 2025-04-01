import {profileModalHTML} from '../scripts/sourcepage.js'
import { MainApp } from './main.js'

export async function setupProfileModal()
{
    const modal = document.getElementById('optionnalModal');
    if (!modal)
        return;
    const userInfos = await MainApp.getUserInfo();
    modal.innerHTML = profileModalHTML(userInfos.username, userInfos.email, userInfos.profile_picture);
    const closeButton = document.getElementById('closeProfileModal');
    if (!closeButton)
        return;
    closeButton.addEventListener('click', () => {
        modal.innerHTML = '';
    });
}