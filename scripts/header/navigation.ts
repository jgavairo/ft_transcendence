import { libraryPage, storePage, communityPage, profileWindow, profileModalHTML } from '../sourcepage.js';
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
import { updateChatWidgetVisibility } from "../main.js";

export let boolprofileMenu = false;
export function changeActiveButton(newButton: HTMLElement, newActiveButton: HTMLElement)
{
	newButton.classList.replace('activebutton', 'button');
	newActiveButton.classList.replace('button', 'activebutton');
}

let notificationSocket: ReturnType<typeof io> | null = null;

export async function setupHeader()
{
	attachNavigationListeners();
	setupProfileButton()
	const response = await api.get(`https://${HOSTNAME}:8443/api/user/infos`);
	const data = await response.json();
	notificationSocket = io(`https://${HOSTNAME}:8443/notification`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
	notificationSocket.on("connect", () => {
    });

    notificationSocket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
    });

    notificationSocket.on("error", (error) => {
        console.error("Socket.IO error:", error);
    });

	notificationSocket.on("friendNotification", (data) => {
		if (data.message)
			showNotification(data.message);
		renderPeopleList();
	});

	notificationSocket.on("notification", (data) => {
		if (data.message)
			showNotification(data.message);
	});

	notificationSocket.on("logout", (data) => {
		LoginManager.logout();
	});

	if (data && data.success)
		notificationSocket.emit('register', {username: data.user.username});
}

export function disconnectNotificationSocket()
{
	if (notificationSocket)
	{
		notificationSocket.disconnect();
		notificationSocket = null;
	}
}

function attachNavigationListeners() 
{
	const profilewindow = document.getElementById('profileMenu');
	const navigationButtons = document.querySelectorAll('.header button');
	const storeButton = document.getElementById('storebutton');
	const logoHeader = document.getElementById('logoHeader');
	if (!storeButton || !logoHeader)
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
	const logoButton = document.getElementById('logoHeader');
	if (!logoButton)
		return;
	logoButton.addEventListener('click', () => {
		let currentActiveButton = document.querySelector('.header .activebutton') as HTMLElement;
		if (currentActiveButton.id === 'storebutton')
			return;
		if (!currentActiveButton)
			currentActiveButton = storeButton;
		if (boolprofileMenu)
		{
			profilewindow.innerHTML = "";
			boolprofileMenu = false;
		}
		changeActiveButton(currentActiveButton, storeButton);
		mainElement.innerHTML = storePage;
		setupStore();
		setupChatWidget();
		window.history.pushState({ page: 'store' }, '', '/store');
	});


	navigationButtons.forEach(button => {
		button.addEventListener('click', () => {
			let currentActiveButton = document.querySelector('.header .activebutton') as HTMLElement;
			if (!currentActiveButton)
				currentActiveButton = storeButton;
			switch (button.id) {
                case 'librarybutton':
					if (currentActiveButton.id === 'librarybutton')
						return;
					if (boolprofileMenu)
					{
						profilewindow.innerHTML = "";
						boolprofileMenu = false;
					}
					changeActiveButton(currentActiveButton, libraryButton);
                    mainElement.innerHTML = libraryPage;
					setupLibrary();
					setupChatWidget();
					window.history.pushState({ page: 'library' }, '', '/library');
                    break;
				case 'storebutton':
					if (currentActiveButton.id === 'storebutton')
						return;
					if (boolprofileMenu)
					{
						profilewindow.innerHTML = "";
						boolprofileMenu = false;
					}
					changeActiveButton(currentActiveButton, storeButton);
					mainElement.innerHTML = storePage;
					setupStore();
					setupChatWidget();
					window.history.pushState({ page: 'store' }, '', '/store');
                    break;
				case 'communitybutton':
					if (currentActiveButton.id === 'communitybutton')
						return;
					if (boolprofileMenu)
					{
						profilewindow.innerHTML = "";
						boolprofileMenu = false;
					}
					changeActiveButton(currentActiveButton, communityButton);
					mainElement.innerHTML = communityPage;
					showCommunityPage();
					removeChatWidget();
					window.history.pushState({ page: 'community' }, '', '/community');
					break;
			}
		});
	});
}

window.addEventListener('popstate', (event: PopStateEvent) => {
	const profilewindow = document.getElementById('profileMenu');
	const storeButton = document.getElementById('storebutton');
	const libraryButton = document.getElementById('librarybutton');
	const communityButton = document.getElementById('communitybutton');
	const mainElement = document.getElementById('main');

	if (!storeButton || !libraryButton || !communityButton || !mainElement || !profilewindow)
		return;

	const page = event.state?.page || 'store';
	let currentActiveButton = document.querySelector('.header .activebutton') as HTMLElement;
	if (!currentActiveButton)
		currentActiveButton = storeButton;

	if (boolprofileMenu) {
		profilewindow.innerHTML = "";
		boolprofileMenu = false;
	}

	switch (page) {
		case 'library':
			changeActiveButton(currentActiveButton, libraryButton);
			mainElement.innerHTML = libraryPage;
			setupLibrary();
			setupChatWidget();
			break;
		case 'store':
			changeActiveButton(currentActiveButton, storeButton);
			mainElement.innerHTML = storePage;
			setupStore();
			setupChatWidget();
			break;
		case 'community':
			changeActiveButton(currentActiveButton, communityButton);
			mainElement.innerHTML = communityPage;
			showCommunityPage();
			removeChatWidget();
			break;
	}
});

const initialPage = window.location.pathname.slice(1) || 'store';
window.history.replaceState({ page: initialPage }, '', `/${initialPage}`);

// Ajout : afficher le chat widget au chargement initial si on est sur store ou library
if (initialPage === 'store' || initialPage === 'library') {
    setupChatWidget();
}


export function setupProfileButton()
{
	const profilewindow = document.getElementById('profileMenu');
	const profilePicture = document.getElementById('profilea');
	if (!profilePicture)
		return;
	profilePicture.addEventListener('click', () => {
		if (!profilewindow)
		{
			return;
		}
		if (!boolprofileMenu)
		{
			profilewindow.innerHTML = profileWindow
			boolprofileMenu = true;
			const logoutButton = document.getElementById('logoutButton');
			if (!logoutButton)
				return;
			logoutButton.addEventListener('click', async () => {
				try {
					const response = await api.get(`https://${HOSTNAME}:8443/api/auth/logout`);
					const data = await response.json();
					if (data.success) {
						showNotification("Logged out successfully");
						const main = document.getElementById('main');
						if (!main)
							return;
						main.innerHTML = "";
						disconnectNotificationSocket();
						updateChatWidgetVisibility(); // Masque le chat après logout
						LoginManager.showLoginModal();
					} else {
						showErrorNotification(data.message);
					}
				} catch (error) {
					console.error('Error during logout:', error);
					showErrorNotification("Error during logout");
				}
			});
			const profileSettingsButton = document.getElementById('profileSettings');
			if (!profileSettingsButton)
				return;
			profileSettingsButton.addEventListener('click', () => {
				setupProfileModal();
			});
		}
		else if (boolprofileMenu)
		{
			profilewindow.innerHTML = "";
			boolprofileMenu = false;
		}
	});
}
