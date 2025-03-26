import { setupLibrary } from './library.js';
import { libraryPage, storePage, communityPage, profileWindow } from './sourcepage.js';
import { setupStore } from './store.js';
let boolprofileMenu = false;

function changeActiveButton(newButton: HTMLElement, newActiveButton: HTMLElement)
{
	newButton.classList.replace('activebutton', 'button');
	newActiveButton.classList.replace('button', 'activebutton');
}

function setupHeader()
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
					break;
			}
		});
	});
}


function setupProfileButton()
{
	const profilewindow = document.getElementById('profileMenu');
	const profilePicture = document.getElementById('profilePicture');
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
