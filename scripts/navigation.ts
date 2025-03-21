import { libraryPage, storePage, communityPage } from './sourcepage.js';
import { setupStore } from './store.js';

function attachNavigationListeners() {
	const navigationButtons = document.querySelectorAll('.header .button');
	navigationButtons.forEach(button => {
		button.addEventListener('click', () => {
			switch (button.id) {
                case 'librarybutton':
                    document.body.innerHTML = libraryPage;
                    attachNavigationListeners();
                    break;
				case 'storebutton':
					document.body.innerHTML = storePage;
					attachNavigationListeners();
					setupStore();
                    break;
				case 'communitybutton':
					document.body.innerHTML = communityPage;
					attachNavigationListeners();
					break;
			}
		});
	});
}

document.addEventListener('DOMContentLoaded', () => {
	attachNavigationListeners();
});
