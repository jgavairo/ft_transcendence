const storePage = `
<header class="header">
		<img src="../../assets/logo.png" alt="Logo" class="w-12" />
		<button class="activebutton" id="storebutton">STORE</button>
		<button class="button" id="librarybutton">LIBRARY</button>
		<button class="button" id="communitybutton">COMMUNITY</button>
	</header>
	<main class="main">
		<div class="gamescontainer">
			<div class="gamecard" id="pongcard">
				<div class="flex">
					<img src="../../games/pong/pong.png" class="gamecard-logo" alt="pong-logo">
					<div class="gamedescription">
						<h4 class="textdescription" id="pongdescription">Rediscover the famous Pong game in a whole new light. With cutting-edge technologies, unlock the rarest skins to show off in game with your friends.</h4>	
					</div>
				</div>
				<h3 class="gametitle" id="pongtitle">King Pong</h3>
				<h4 class="price" id="pongprice">Free</h4>
				<button class="buybutton" id="pongbuybutton">Add to library</button>
			</div>
			<div class="gamecard" id="valorantcard">
				<div class="flex">
					<img src="../../games/valorant/valorant.png" class="gamecard-logo" alt="valorant-logo">
					<div class="gamedescription">
						<h4 class="textdescription" id="valorantdescription">Valorant est un jeu de tir tactique 5v5 pas gratuit où des agents aux capacités uniques s'affrontent dans des combats intenses. Maîtrisez vos compétences, coordonnez-vous avec votre équipe et relevez le défi de la compétition.</h4>	
					</div>
				</div>
				<h3 class="gametitle" id="valoranttitle">Valorant</h3>
				<h4 class="price" id="valorantprice">29.99$</h4>
				<button class="buybutton" id="valorantbuybutton">Add to library</button>
			</div>
			<div class="gamecard" id="snakecard">
				<div class="flex">
					<img src="../../games/snake/snake.png" class="gamecard-logo" alt="snake-logo">
					<div class="gamedescription">
						<h4 class="textdescription" id="snakedescription">Recevez une invitation mystérieuse à la soirée de Francis le Tordu (YOUPiiIIII). Dans ce jeu psychologique troublant, naviguez à travers une demeure victorienne où les règles changent constamment et où vos choix ont des conséquences... imprévisibles. Les autres invités semblent connaître les règles, mais personne ne veut les partager. Évitez les regards tordus de Francis, découvrez pourquoi certains invités disparaissent après avoir bu le cocktail du chef, et tentez de survivre jusqu'au matin. Mais attention : Francis déteste quand on refuse de danser la valse inversée</h4>	
					</div>
				</div>
				<h3 class="gametitle" id="snaketitle">Francis le Tordu</h3>
				<h4 class="price" id="snakeprice">Allez viens</h4>
				<button class="buybutton" id="snakebuybutton">Add to library</button>
			</div>
		</div>
	</main>
`;

const libraryPage = `
  <div class="flex flex-col h-screen">
    <header class="header">
      <img src="../../assets/logo.png" alt="Logo" class="w-12" />
      <button class="button" id="storebutton">STORE</button>
      <button class="activebutton" id="librarybutton">LIBRARY</button>
      <button class="button" id="communitybutton">COMMUNITY</button>
    </header> 
    <main class="flex flex-1">
      <aside class="w-1/4 bg-[#24282F] overflow-y-auto p-4">
        <div class="mb-4 relative">
          <input 
          type="text" 
          placeholder="Search" 
          class="w-full pl-8 pr-2 py-2 rounded bg-gray-700 placeholder-gray-400 text-white"
          >
          <div class="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M9.5 17a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"/>
            </svg>
          </div>
        </div>
        <ul>
          <li class="gamesidelist" id="pongsidelist">
            <img src="../../games/pong/pong.png" alt="Pong" class="w-4 h-4 mr-2">
            Classic pong game
          </li>
          <li class="gamesidelist" id="snakesidelist">
            <img src="../../games/snake/snake.png" alt="Snake" class="w-4 h-4 mr-2">
            Call of Francis
          </li>
        </ul>
      </aside>
      
      <section class="w-3/4 p-4 flex flex-col">
        <div class="flex items-center mb-4">
          <h2 class="mt-2 text-xl font-bold text-[#8F8F8F]">All games (2)</h2>
          <div class="mt-2 flex-1 border-t border-gray-500 ml-4"></div>
        </div>
        <div class="flex flex-1 gap-4">
          <img src="../../games/pong/pong.png" alt="Pong" class="w-60 h-60 object-cover rounded">
          <img src="../../games/snake/snake.png" alt="Snake" class="w-60 h-60 object-cover rounded">
        </div>
      </div>
    </section>
  </main>
</div>
`;

const communityPage = `
	<header class="header">
		<img src="../../assets/logo.png" alt="Logo" class="w-12" />
		<button class="button" id="storebutton">STORE</button>
		<button class="button" id="librarybutton">LIBRARY</button>
		<button class="activebutton" id="communitybutton">COMMUNITY</button>
	</header>
`;

export { storePage, libraryPage, communityPage };
