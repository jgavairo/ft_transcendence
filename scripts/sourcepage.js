var _a, _b, _c;
import { UserLibraryManager } from '../scripts/userLibrary.js';
const header = `
			<img src="../../assets/logo.png" alt="Logo" class="w-12" />
			<button class="activebutton" id="storebutton">STORE</button>
			<button class="button" id="librarybutton">LIBRARY</button>
			<button class="button" id="communitybutton">COMMUNITY</button>
			<div class="profile" id="profilea">
				<img class="profilePicture" id="profilePicture" src="../../assets/profile_pictures/rael.png" alt="Profile Picture" />
				<span class="profileName">jgavairo</span>
				<svg class="profileArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 9l6 6 6-6"/>
				</svg>
				<div id="profileMenu" class="profileMenu">
				</div>
				<button class="profilebutton" id="profilebutton"></button>
			</div>
`;
const profileWindow = `
		<div class="profilewindow">
				<button id="profileSettings">
        Profile settings
				</button>
				<button id="logoutButton">
        Log out
				</button>
		</div>
`;
const storePage = `
		<div class="gamescontainer">
		</div>
`;
const libraryPage = `
    <aside class="sidebar">
      <div class="search-container">
        <input type="text" placeholder="Search" class="search-input">
        <div class="search-icon">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/>
          </svg>
        </div>
      </div>
      <ul class="library-games-list"></ul>
    </aside>
    <section class="main-section">
      <div class="library-details"></div>
    </section>
`;
const communityPage = `
`;
const profileModalHTML = `
    <div class="modal-overlay" id="modalWindow">
        <div class="login-modal" id="profile-modal">
          <div class="profile-modal-content">
            <button class="closeProfileModal" id="closeProfileModal">X</button>
            <h2>Profile settings</h2>
            <img src="${(_a = UserLibraryManager.getCurrentUser()) === null || _a === void 0 ? void 0 : _a.profilePicture}" class="pictureProfileModal" alt="Profile Picture" />
            <div class="profile-modal-content-info">
              <div id="username">
                <h3>Username: ${(_b = UserLibraryManager.getCurrentUser()) === null || _b === void 0 ? void 0 : _b.userName}</h3>
              </div>
              <div id="email">
                <h3>Email: ${(_c = UserLibraryManager.getCurrentUser()) === null || _c === void 0 ? void 0 : _c.email}</h3>
              </div>
            </div>
          </div>
        </div>
    </div>
`;
const gameModalHTML = `
    <div class="modal-overlay" id="modalWindow">
        <div class="game-modal" id="games-modal">
          <canvas id="pongCanvas" width="1184" height="784"></canvas>
        </div>
    </div>
`;
export { storePage, libraryPage, communityPage, header, profileWindow, profileModalHTML, gameModalHTML };
