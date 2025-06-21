import api from "../../helpers/api.js";
import { LoginManager } from "../../managers/loginManager.js";
import { HOSTNAME } from "../../main.js";


export interface News {
    id?: number;          // Optional, auto-incremented
    title: string;        // News title
    content: string;      // News content
    image_url: string;    // Associated image URL
    created_at?: string;  // Creation date (optional, auto-generated)
    priority: number;     // Display priority (0 = normal, higher = more priority)
}

export async function setupNews(): Promise<void>
{
    if(!await LoginManager.isLoggedIn())
    {
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
        // Fetch news from the API
        const response = await api.get(`https://${HOSTNAME}:8443/api/news/getAll`);
        const news = await response.json();

        if (!news || news.length === 0) return;

        let currentIndex = 0;

        // Create news items in the carousel
        news.forEach((newsItem: any, index: number) => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-item';
            newsElement.style.display = index === 0 ? 'flex' : 'none';
            
            // Structure of each news item
            newsElement.innerHTML = `
                <div class="news-overlay"></div>
                <div class="news-content">
                    <h2 class="news-title">${newsItem.title}</h2>
                    <p class="news-description">${newsItem.content}</p>
                </div>
            `;
            
            // Add background image
            newsElement.style.backgroundImage = `url('${newsItem.image_url}')`;
            
            carousel.appendChild(newsElement);

            // Create navigation dot
            const dot = document.createElement('div');
            dot.className = `news-dot${index === 0 ? ' active' : ''}`;
            dot.addEventListener('click', () => showNews(index));
            controls.appendChild(dot);
        });

        // Function to display a specific news item
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

        // Event handlers for navigation buttons
        prevButton.addEventListener('click', () => {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : news.length - 1;
            showNews(newIndex);
        });

        nextButton.addEventListener('click', () => {
            const newIndex = currentIndex < news.length - 1 ? currentIndex + 1 : 0;
            showNews(newIndex);
        });

        // Automatic scrolling
        setInterval(() => {
            const newIndex = currentIndex < news.length - 1 ? currentIndex + 1 : 0;
            showNews(newIndex);
        }, 5000);

    } catch (error) {
        console.error('Error while loading news:', error);
    }
}