const header = (username, profilePicture) => `
			<img src="../../assets/logo.png" alt="Logo" class="w-12" />
			<button class="activebutton" id="storebutton">STORE</button>
			<button class="button" id="librarybutton">LIBRARY</button>
			<button class="button" id="communitybutton">COMMUNITY</button>
			<div class="profile" id="profilea">
				<img class="profilePicture" id="profilePicture" src="${profilePicture}" alt="Profile Picture" />
				<span class="profileName">${username}</span>
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
      <input type="text" placeholder="Search" class="search-input" id="searchBar" >
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
  <div class="community-wrapper">
    <section class="chat-section">
      <h2>CHAT</h2>
      <div class="chat-container" id="chatContainer">
        <!-- Messages s'afficheront ici -->
      </div>
      <div class="chat-input-wrapper">
        <input type="text" id="chatInput" placeholder="Écris ton message ici..." maxlength="280" />
        <button id="sendMessage">Envoyer</button>
      </div>
    </section>

    <section class="friends-section">
      <h2>PEOPLE</h2>
      <input type="text" id="friendSearch" placeholder="find someone" maxlength="20" class="friend-input" autocomplete="off" />
      <div class="dropdown" id="friendDropdown"></div> <!-- menu déroulant ici -->
      <div class="friend-list" id="friendList"></div>
    </section>
  </div>
`;
const profileModalHTML = (username, email, profilePicture, bio) => `
    <div class="modal-overlay" id="modalOverlay">
        <div class="profile-modal" id="profile-modal">
          <div class="profile-modal-content">
            <button class="closeProfileModal" id="closeProfileModal">X</button>
            <h2>Profile settings</h2>
            <div class="profile-picture-container-modal">
              <img src="${profilePicture}" class="pictureProfileModal" alt="Profile Picture" />
              <div class="profile-picture-overlay" id="changeProfilePictureButton">
                Edit
              </div>
            </div>
            <div class="profile-modal-content-info">
              <div id="username">
                <h3>Username:</h3>
                <p>${username}</p>
              </div>
              <div id="email">
                <h3>Email:</h3>
                <p>${email}</p>
              </div>
              <div id="bio">
                <h3>Bio:</h3>
                <textarea id="bioInput" maxlength="150" placeholder="Write something about yourself...">${bio}</textarea>
                <button id="saveBioButton" class="save-bio-button">Save Bio</button>
              </div>
              <div id="changePassword">
                <button id="changePasswordButton">Change password</button>
              </div>
            </div>
          </div>
        </div>
    </div>
`;
const uploadPictureFormHTML = `
      <button class="closeProfileModal" id="closeModal">X</button>
      <h2>Choose a new profile picture</h2>
        <div class="picture-upload">
                <div class="upload-container">
                    <input type="file" class="inputPictureForm" id="pictureUploader" accept="image/*">
                    <button type="submit" class="submitPictureForm" id="sendPictureButton">Send</button>
                </div>
        </div>
    `;
const changePasswordModalHTML = `
        <button class="closeProfileModal" id="closeModal">X</button>
        <div class="changePassword-modal" id="changePassword-modal">
            <h2>Change password</h2>
            <div class="changePassword-modal-content">
                <input type="password" id="oldPassword" placeholder="Old password" />
                <input type="password" id="newPassword" placeholder="New password" />
                <input type="password" id="confirmNewPassword" placeholder="Confirm new password" />
                <button id="changePasswordButton">Change password</button>
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
export { storePage, libraryPage, communityPage, header, profileWindow, profileModalHTML, gameModalHTML, uploadPictureFormHTML, changePasswordModalHTML };
