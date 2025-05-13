import { libraryPage, storePage, communityPage, profileWindow } from '../sourcepage.js';
import { setupLibrary } from '../pages/library/library.js';
import { setupStore } from '../pages/store/store.js';
import { showCommunityPage } from '../pages/community/community.js';
import { showNotification, showErrorNotification } from '../helpers/notifications.js';
import { LoginManager } from '../managers/loginManager.js';
import { setupProfileModal } from '../modals/profile/profileModal.js';
import api from '../helpers/api.js';
import { HOSTNAME } from '../main.js';
import { io } from 'socket.io-client';
import { renderPeopleList } from '../pages/community/peopleList.js';
import { setupChatWidget, removeChatWidget } from '../pages/community/chatWidget.js';
export let boolprofileMenu = false;
function changeActiveButton(newButton, newActiveButton) {
    newButton.classList.replace('activebutton', 'button');
    newActiveButton.classList.replace('button', 'activebutton');
}
let notificationSocket = null;
export async function setupHeader() {
    attachNavigationListeners();
    setupProfileButton();
    const response = await api.get(`http://${HOSTNAME}:3000/api/user/infos`);
    const data = await response.json();
    notificationSocket = io(`http://${HOSTNAME}:3000/notification`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    notificationSocket.on("connect", () => {
        console.log("Connected to Socket.IO server");
    });
    notificationSocket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
    });
    notificationSocket.on("error", (error) => {
        console.error("Socket.IO error:", error);
    });
    notificationSocket.on("friendNotification", (data) => {
        console.log("friendNotification", data.message);
        if (data.message)
            showNotification(data.message);
        renderPeopleList();
    });
    if (data && data.success)
        notificationSocket.emit('register', { username: data.user.username });
}
export function disconnectNotificationSocket() {
    if (notificationSocket) {
        notificationSocket.disconnect();
        notificationSocket = null;
    }
}
function attachNavigationListeners() {
    const profilewindow = document.getElementById('profileMenu');
    const navigationButtons = document.querySelectorAll('.header button');
    const storeButton = document.getElementById('storebutton');
    if (!storeButton)
        return;
    const libraryButton = document.getElementById('librarybutton');
    if (!libraryButton)
        return;
    const communityButton = document.getElementById('communitybutton');
    if (!communityButton)
        return;
    const mainElement = document.getElementById('main');
    if (!mainElement)
        return;
    if (!profilewindow)
        return;
    navigationButtons.forEach(button => {
        button.addEventListener('click', () => {
            let currentActiveButton = document.querySelector('.header .activebutton');
            if (!currentActiveButton)
                currentActiveButton = storeButton;
            switch (button.id) {
                case 'librarybutton':
                    if (currentActiveButton.id === 'librarybutton')
                        return;
                    if (boolprofileMenu) {
                        profilewindow.innerHTML = "";
                        boolprofileMenu = false;
                    }
                    changeActiveButton(currentActiveButton, libraryButton);
                    mainElement.innerHTML = libraryPage;
                    setupLibrary();
                    setupChatWidget(); // Affiche la bulle de chat
                    break;
                case 'storebutton':
                    if (currentActiveButton.id === 'storebutton')
                        return;
                    if (boolprofileMenu) {
                        profilewindow.innerHTML = "";
                        boolprofileMenu = false;
                    }
                    changeActiveButton(currentActiveButton, storeButton);
                    mainElement.innerHTML = storePage;
                    setupStore();
                    setupChatWidget(); // Affiche la bulle de chat
                    break;
                case 'communitybutton':
                    if (currentActiveButton.id === 'communitybutton')
                        return;
                    if (boolprofileMenu) {
                        profilewindow.innerHTML = "";
                        boolprofileMenu = false;
                    }
                    changeActiveButton(currentActiveButton, communityButton);
                    mainElement.innerHTML = communityPage;
                    showCommunityPage();
                    removeChatWidget(); // Supprime la bulle de chat
                    break;
            }
        });
    });
}
export function setupProfileButton() {
    console.log("setupProfileButton");
    const profilewindow = document.getElementById('profileMenu');
    const profilePicture = document.getElementById('profilea');
    if (!profilePicture)
        return;
    profilePicture.addEventListener('click', () => {
        console.log("profile button clicked");
        if (!profilewindow) {
            console.log("profile window not found");
            return;
        }
        if (!boolprofileMenu) {
            profilewindow.innerHTML = profileWindow;
            boolprofileMenu = true;
            const logoutButton = document.getElementById('logoutButton');
            if (!logoutButton)
                return;
            logoutButton.addEventListener('click', async () => {
                console.log("logout button clicked");
                try {
                    const response = await api.get(`http://${HOSTNAME}:3000/api/auth/logout`);
                    const data = await response.json();
                    console.log('response:', data);
                    if (data.success) {
                        showNotification("Logged out successfully");
                        const main = document.getElementById('main');
                        if (!main)
                            return;
                        main.innerHTML = "";
                        disconnectNotificationSocket();
                        LoginManager.showLoginModal();
                    }
                    else {
                        showErrorNotification(data.message);
                    }
                }
                catch (error) {
                    console.error('Error during logout:', error);
                    showErrorNotification("Error during logout");
                }
            });
            const profileSettingsButton = document.getElementById('profileSettings');
            if (!profileSettingsButton)
                return;
            profileSettingsButton.addEventListener('click', () => {
                console.log("profile settings button clicked");
                setupProfileModal();
            });
        }
        else if (boolprofileMenu) {
            profilewindow.innerHTML = "";
            boolprofileMenu = false;
        }
    });
}
