document.addEventListener('DOMContentLoaded', () => {

	const navigationButtons = document.querySelectorAll('.header .button');

	navigationButtons.forEach(button => {
		button.addEventListener('click', () => {
			switch (button.id) {
                case 'librarybutton':
                    document.body.innerHTML = `
                        <header class="header">
                            <img src="../../assets/logo.png" alt="Logo" class="w-12" />
                            <button class="button" id="storebutton">STORE</button>
                            <button class="activebutton" id="librarybutton">LIBRARY</button>
                            <button class="button" id="communitybutton">COMMUNITY</button>
                        </header>
                        <div class="flex flex-1">
                            <aside class="w-1/4 bg-[#24282F] overflow-y-auto p-4">
                                <div class="mb-4">
                                    <input type="text" placeholder="Search" class="w-full p-2 rounded bg-gray-700 placeholder-gray-400 text-white">
                                </div>
                                <div>
                                    <ul>
                                        <li class="mb-2 text-white">Classic pong game</li>
                                    </ul>
                                </div>
                            </aside>
                            <main class="w-3/4 p-4">
                                <h2 class="text-xl font-bold mb-4 text-white">All games (1)</h2>
                                <div class="grid grid-cols-3 gap-4">
                                    <div class="bg-gray-700 p-4 rounded text-white">Pong</div>
                                </div>
                            </main>
                        </div>`;
                    break;
				case 'storebutton':
					document.body.innerHTML = `
						<header class="header">
							<img src="../../assets/logo.png" alt="Logo" class="w-12" />
							<button class="activebutton" id="storebutton">STORE</button>
							<button class="button" id="librarybutton">LIBRARY</button>
							<button class="button" id="communitybutton">COMMUNITY</button>
						</header>
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
						</div>`;
                    break;
            }
		});
	});
});
