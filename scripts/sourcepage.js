const header = `
			<img src="../../assets/logo.png" alt="Logo" class="w-12" />
			<button class="activebutton" id="storebutton">STORE</button>
			<button class="button" id="librarybutton">LIBRARY</button>
			<button class="button" id="communitybutton">COMMUNITY</button>
			<div class="profile">
				<img class="profilePicture" id="profilePicture" src="../../assets/profilePicture.jpeg" alt="Profile Picture" />
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
				<button class="logoutbutton" id="logoutButton">
        Log out
				</button>
		</div>
`;
const storePage = `
		<div class="gamescontainer">
		</div>
`;
const libraryPage = `
      <div class="flex flex-1">
      <aside class="w-1/4 bg-[#24282F] overflow-y-auto p-4">
        <div class="mb-4 relative">
          <input 
          type="text" 
          placeholder="Search" 
          class="w-full pl-8 pr-2 py-2 rounded bg-gray-700 placeholder-gray-400 text-white">
          <div class="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/>
            </svg>
          </div>
        </div>
          <ul class="library-games-list"></ul>
        </aside>
        <section class="w-full">
          <div class="library-details">
          <div class="flex items-center mb-4">
             <h2 class="mt-2 text-xl font-bold text-[#8F8F8F]">All games (0)</h2>
          <div class="mt-2 flex-1 border-t border-gray-500 ml-4"></div>
          </div>
          </div>
        </section>
      </div>
`;
const communityPage = `
`;
export { storePage, libraryPage, communityPage, header, profileWindow };
