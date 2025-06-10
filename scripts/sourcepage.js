const header = (username, profilePicture) => `
			<img src="../../assets/logo.png" alt="Logo" class="logo" id="logoHeader" />
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
    <div class="storecontainer">
        <div class="newscontainer">
            <div class="news-carousel" id="newsCarousel">
            </div>
            <div class="news-controls" id="newsControls">
            </div>
            <div class="news-arrow prev" id="prevNews">❮</div>
            <div class="news-arrow next" id="nextNews">❯</div>
        </div>
		  <div class="gamescontainer">
		  </div>
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
const loginModalHTML = `
    <div class="modal-overlay" id="modalWindow">
        <div class="login-modal" id="login-modal">
            <h2>ft_transcendence</h2>
            <form id="loginForm" class = "login-form">
                <input type="text" id="username" placeholder="Username" required>
                <input type="password" id="password" placeholder="Password" required>
                </form>
            <button id="loginButton" class="loginButton">Sign in</button>
            <button id="googleSignIn" class="googleButton">
                    <img src="../../assets/google.png" class="googleLogo" alt="Google logo">
                    Sign in with Google
            </button>
            <div class="registerContainer">
                you don't have an account? 
                <button id="registerButton" class="registerButton">Sign up</button>
            </div>
        </div>
    </div>
`;
const twoFactorModalHTML = `
    <div class="modal-overlay" id="modalWindow">
        <div class="twofaModal" id="twofaModal">
            <div class="changePassword-modal-header">
                <button class="backArrow" id="backToLogin" aria-label="Back">←</button>
            </div>
            <h2>Please enter the code sent to your email</h2>
            <form id="loginForm" class = "login-form">
                <input type="text" id="code" placeholder="Code" required>
                </form>
            <button id="loginButton" class="loginButton">Verify</button>
        </div>
    </div>
`;
const registerModalHTML = `
            <div class="registerModalTitle">
                <button id="cancelButton" class="cancelButton">Cancel</button>
                <h2>Sign up</h2>
            </div>
            <form id="registerForm" class = "register-form">
                <input type="text" id="Rusername" placeholder="Username" required>
                <input type="password" id="Rpassword" placeholder="Password" required>
                <input type="password" id="RconfirmPassword" placeholder="confirm password" required>
                <input type="email" id="Remail" placeholder="Email" required>
            </form>
            <button id="registerRequestButton" class="signupButton">Sign up</button>
`;
const profileModalHTML = (username, email, profilePicture, bio, twoFactorEnabled, isGoogleAccount) => `
    <div class="modal-overlay" id="modalOverlay">
        <div class="profile-modal" id="profile-modal">
          <div class="profile-modal-header">
            <button class="closeProfileModal" id="closeProfileModal">X</button>
          </div>
          <div class="profile-modal-content">
            <h2>Profile settings</h2>
            <div class="profile-picture-container-modal">
              <img src="${profilePicture}" class="pictureProfileModal" alt="Profile Picture" />
              <div class="profile-picture-overlay" id="changeProfilePictureButton">
                Edit
              </div>
            </div>
            <div class="profile-modal-content-info">
              <div id="username">
                <h3>Username:&nbsp;</h3>
                <p>${username}</p>
              </div>
              <div id="email">
                <h3>Email:&nbsp;</h3>
                <p>${email}</p>
              </div>
              <div id="bio">
                <textarea id="bioInput" class="bio-input" placeholder="Write something about yourself...">${bio}</textarea>
                <button id="saveBioButton" class="profile-modal-button-bio">Save Bio</button>
              </div>
              <div class="profile-modal-button-container">
                ${!isGoogleAccount ? `
                <div id="changePassword">
                  <button id="changePasswordButton" class="profile-modal-button-password">Change password</button>
                </div>
                <div id="changeEmail">
                  <button id="changeEmailButton" class="profile-modal-button-email">Change email</button>
                </div>
                <div id="changeUsername">
                  <button id="changeUsernameButton" class="profile-modal-button-username">Change username</button>
                </div>
                ` : `
                <div id="changeUsername">
                  <button id="changeUsernameButton" class="profile-modal-button-username">Change username</button>
                </div>
                `}
              </div>
              ${!isGoogleAccount ? `
              <div id="doubleAuthentification">
                  ${twoFactorEnabled ?
    `<button id="disable2FAButton" class="profile-modal-button-disable2fa">
                          Disable 2FA Security
                      </button>` :
    `<button id="enable2FAButton" class="profile-modal-button-enable2fa">
                          Enable 2FA Security
                      </button>`}
              </div>
              ` : ''}
            </div>
          </div>
        </div>
    </div>
`;
const uploadPictureFormHTML = `
      <div class="profile-modal-header">
          <button class="backArrow" id="backToProfileSettings" aria-label="Back">←</button>
      </div>
      <h2>Choose a new profile picture</h2>
        <div class="picture-upload">
                <div class="upload-container">
                    <input type="file" class="inputPictureForm" id="pictureUploader" accept="image/*">
                    <button type="submit" class="submitPictureForm" id="sendPictureButton">Send</button>
                </div>
        </div>
    `;
const changePasswordModalHTML = `
        <div class="changePassword-modal-header">
            <button class="backArrow" id="backToProfileSettings" aria-label="Back">←</button>
        </div>
        <div class="changePassword-modal" id="changePassword-modal">
            <h2>Change password</h2>
            <div class="changePassword-modal-content">
                <input type="password" class="changePasswordInput" id="oldPassword" placeholder="Old password" />
                <input type="password" class="changePasswordInput" id="newPassword" placeholder="New password" />
                <input type="password" class="changePasswordInput" id="confirmNewPassword" placeholder="Confirm new password" />
                <button id="changePasswordButton">Change password</button>
            </div>
        </div>
`;
const disable2FAModalHTML = `
        <div class="changePassword-modal-header">
            <button class="backArrow" id="backToProfileSettings" aria-label="Back">←</button>
        </div>
        <div class="changePassword-modal" id="changePassword-modal">
            <h2>Disable 2FA</h2>
            <div class="changePassword-modal-content">
                <input type="password" class="changePasswordInput" id="password" placeholder="Password" />
                <button id="disable2FAButton" class="button-disable2fa">Disable 2FA</button>
            </div>
        </div>
`;
const changeUsernameModalHTML = `
        <div class="changeUsername-modal-header">
            <button class="backArrow" id="backToProfileSettings" aria-label="Back">←</button>
        </div>
        <div class="changeUsername-modal" id="changeUsername-modal">
            <h2>Change username</h2>
            <div class="changePassword-modal-content">
                <input type="text" class="changePasswordInput" id="newUsername" placeholder="New username" />
                <button id="changeUsernameButton">Change username</button>
            </div>
        </div>
`;
const changeEmailModalHTML = `
        <div class="changeEmail-modal-header">
            <button class="backArrow" id="backToProfileSettings" aria-label="Back">←</button>
        </div>
        <div class="changeEmail-modal" id="changeEmail-modal">
            <h2>Change email</h2>
            <div class="changePassword-modal-content">
                <input type="text" class="changePasswordInput" id="newEmail" placeholder="New email" />
                <button id="changeEmailButton">Change email</button>
            </div>
        </div>
`;
const changeDoubleAuthentificationModalHTML = `
        <div class="changeDoubleAuthentification-modal-header">
            <button class="backArrow" id="backToProfileSettings" aria-label="Back">←</button>
        </div>
        <div class="changeDoubleAuthentification-modal" id="changeDoubleAuthentification-modal">
            <h2>Verify your email</h2>
            <div class="changeDoubleAuthentification-modal-content">
                <input type="text" class="changeDoubleAuthentificationInput" id="code" placeholder="Secret code" />
                <button id="changeDoubleAuthentificationButton">Verify email and activate 2FA</button>
            </div>
        </div>
`;
const gameModalHTML = `
    <div class="modal-overlay" id="modalWindow">
        <div class="game-modal" id="games-modal" style="width: 1216px; height: 816px;">
        </div>
    </div>
    `;
const gameInfosModalHTML = (game, inLibrary) => `
<div class="modal-overlay" id="modalOverlay">
    <div class="gameInfosModal" id="gameInfosModal" style="background-image: url('${game.image}');">
    <div class="gameInfosModal-overlay">
    <h1>${game.name}</h1>
    <div class="game-details">
      <p class="game-description">${game.description}</p>
      <button class="${!game.is_available ? 'owned-button' : (inLibrary ? 'owned-button' : 'buybutton')}" 
              id="${game.name}buybutton" 
              ${!game.is_available ? 'disabled' : ''}>
        ${!game.is_available ? 'is not available yet' : (inLibrary ? 'Already in library' : `Add to library `)}
      </button>
    </div>
  </div>
</div>
</div>`;
export { storePage, libraryPage, communityPage, header, profileWindow, profileModalHTML, gameModalHTML, uploadPictureFormHTML, changePasswordModalHTML, loginModalHTML, registerModalHTML, gameInfosModalHTML, changeUsernameModalHTML, changeEmailModalHTML, changeDoubleAuthentificationModalHTML, disable2FAModalHTML, twoFactorModalHTML };
