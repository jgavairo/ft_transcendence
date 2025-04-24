import { libraryPage, storePage, communityPage, profileWindow, profileModalHTML } from '../sourcepage.js';
import { setupLibrary } from '../pages/library/library.js';
import { setupStore } from '../pages/store/store.js';
import { showCommunityPage } from '../pages/community/community.js';
import { showNotification } from '../helpers/notifications.js';
import { LoginManager } from '../managers/loginManager.js';
import { setupProfileModal } from '../modals/profile/profileModal.js';
import api from '../helpers/api.js';


let boolprofileMenu = false;
function changeActiveButton(newButton: HTMLElement, newActiveButton: HTMLElement)
{
	newButton.classList.replace('activebutton', 'button');
	newActiveButton.classList.replace('button', 'activebutton');
}

export function setupHeader()
{
	attachNavigationListeners();
	setupProfileButton()
}


function attachNavigationListeners() 
{
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
					break;
			}
		});
	});
}


export function setupProfileButton()
{
	const profilewindow = document.getElementById('profileMenu');
	const profilePicture = document.getElementById('profilea');
	if (!profilePicture)
		return;
	profilePicture.addEventListener('click', () => {
		console.log("profile button clicked");
		if (!profilewindow)
		{
			console.log("profile window not found");
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
				console.log("logout button clicked");
				const response = await api.get('http://127.0.0.1:3000/api/auth/logout');
				console.log('response:', response);
				showNotification("Logged out successfully");
				const main = document.getElementById('main');
				if (!main)
					return;
				main.innerHTML = "";
				LoginManager.showLoginModal();
				return;
			});
			const profileSettingsButton = document.getElementById('profileSettings');
			if (!profileSettingsButton)
				return;
			profileSettingsButton.addEventListener('click', () => {
				console.log("profile settings button clicked");
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

document.addEventListener('DOMContentLoaded', () => {
	setupHeader();
});
