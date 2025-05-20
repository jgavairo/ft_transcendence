import api from "../../helpers/api.js";
import { LoginManager } from "../../managers/loginManager.js";
import { HOSTNAME } from "../../main.js";


export interface News {
    id?: number;          // Optionnel car auto-incrémenté
    title: string;        // Titre de la news
    content: string;      // Contenu de la news
    image_url: string;    // URL de l'image associée
    created_at?: string;  // Date de création (optionnel car auto-généré)
    priority: number;     // Priorité d'affichage (0 = normal, plus grand = plus prioritaire)
}

export async function setupNews(): Promise<void>
{
    if(!await LoginManager.isLoggedIn())
    {
        console.log("Not logged in, showing login modal");
        LoginManager.showLoginModal();
        return;
    }

    const newsContainer = document.querySelector('.newscontainer');
    if (!newsContainer)
        return;

    const carousel = document.getElementById('newsCarousel');
    const controls = document.getElementById('newsControls');
    const prevButton = document.getElementById('prevNews');
    const nextButton = document.getElementById('nextNews');

    if (!carousel || !controls || !prevButton || !nextButton) return;

    try {
        // Récupération des news depuis l'API
        const response = await api.get(`https://${HOSTNAME}:8443/api/news/getAll`);
        const news = await response.json();

        if (!news || news.length === 0) return;

        let currentIndex = 0;

        // Création des news dans le carousel
        news.forEach((newsItem: any, index: number) => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-item';
            newsElement.style.display = index === 0 ? 'flex' : 'none';
            
            // Structure de chaque news
            newsElement.innerHTML = `
                <div class="news-overlay"></div>
                <div class="news-content">
                    <h2 class="news-title">${newsItem.title}</h2>
                    <p class="news-description">${newsItem.content}</p>
                </div>
            `;
            
            // Ajout de l'image de fond
            newsElement.style.backgroundImage = `url('${newsItem.image_url}')`;
            
            carousel.appendChild(newsElement);

            // Création du point de navigation
            const dot = document.createElement('div');
            dot.className = `news-dot${index === 0 ? ' active' : ''}`;
            dot.addEventListener('click', () => showNews(index));
            controls.appendChild(dot);
        });

        // Fonction pour afficher une news spécifique
        function showNews(index: number): void {
            if (!carousel || !controls) return;
            const newsItems = carousel.getElementsByClassName('news-item');
            const dots = controls.getElementsByClassName('news-dot');

            Array.from(newsItems).forEach((item: Element, i: number) => {
                (item as HTMLElement).style.display = i === index ? 'flex' : 'none';
            });

            Array.from(dots).forEach((dot, i: number) => {
                dot.className = `news-dot${i === index ? ' active' : ''}`;
            });

            currentIndex = index;
        }

        // Gestionnaires d'événements pour les boutons de navigation
        prevButton.addEventListener('click', () => {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : news.length - 1;
            showNews(newIndex);
        });

        nextButton.addEventListener('click', () => {
            const newIndex = currentIndex < news.length - 1 ? currentIndex + 1 : 0;
            showNews(newIndex);
        });

        // Défilement automatique
        setInterval(() => {
            const newIndex = currentIndex < news.length - 1 ? currentIndex + 1 : 0;
            showNews(newIndex);
        }, 5000);

    } catch (error) {
        console.error('Erreur lors du chargement des news:', error);
    }
}