const header = `
			<img src="../../assets/logo.png" alt="Logo" class="w-12" />
			<button class="activebutton" id="storebutton">STORE</button>
			<button class="button" id="librarybutton">LIBRARY</button>
			<button class="button" id="communitybutton">COMMUNITY</button>
			<div class="profile">
				<img class="profilePicture" id="profilePicture" src="../../assets/profilePicture.jpeg" alt="Profile Picture" />
				<button class="profilebutton" id="profilebutton"></button>
			</div>
`;
const profileWindow = `
		<ul class="profilewindow">
			<li class="profilewindow-item">
				<button id="profileSettings">Profile settings</button>
			</li>
			<li class="profilewindow-item">
				<button id="logoutButton">Log out</button>
			</li>
		</ul>
`;
const storePage = `
		<div class="gamescontainer">
		</div>
`;
const libraryPage = `
    <div class="container">
    <aside class="sidebar">
      <div class="search-container flex">
        <input 
          type="text" 
          placeholder="Search" 
          class="search-input">
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
      <div class="library-details">
        <div class="header-section flex">
          <h2>All games (0)</h2>
          <div class="divider"></div>
        </div>
      </div>
    </section>
  </div>
`;
const communityPage = `
`;
export { storePage, libraryPage, communityPage, header, profileWindow };
