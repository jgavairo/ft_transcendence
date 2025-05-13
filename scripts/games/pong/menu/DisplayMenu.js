import { initTriPong } from '../TriPong.js';
import { displayPlayMenu } from './PlayMenu.js';
export const menuBg = new Image();
menuBg.src = '../../../../assets/games/pong/background.png';
const titleImage = new Image();
titleImage.src = '../../../../assets/games/pong/title.png';
let titleY = -200; // Position initiale plus haute
const titleSpeed = 2.5; // Vitesse plus lente
const titleFinalY = 100; // Position finale ajustée
let animationFrameId;
let isAnimating = false;
// Ajouter une constante pour la vitesse de base des particules
const BASE_PARTICLE_SPEED = 0.5;
// Ajouter une constante pour limiter le FPS
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let lastFrameTime = 0;
// Déclarer les gestionnaires d'événements comme des variables globales
let onMouseMove;
let onMouseDown;
let onMouseUp;
// Au début du fichier
let mouseX = 0;
let mouseY = 0;
let mousePressed = false;
let mouseJustClicked = false;
function animateTitle() {
    if (!particlesCtx || !titleImage.complete)
        return;
    if (titleY < titleFinalY) {
        titleY += titleSpeed;
    }
    // Calculer la taille réduite (par exemple 40% de la largeur du canvas)
    const scale = 0.5;
    const newWidth = particlesCanvas.width * scale;
    const newHeight = (titleImage.height * newWidth) / titleImage.width;
    particlesCtx.drawImage(titleImage, (particlesCanvas.width - newWidth) / 2, titleY, newWidth, newHeight);
}
const buttons = [];
let particlesCanvas;
let particlesCtx;
const particles = [];
function getRandomColor() {
    const colors = [
        '#00FFFF', // Cyan néon
        '#4B0082', // Indigo profond
        '#9400D3', // Violet vif
        '#8A2BE2', // Bleu violet
        '#4B0082', // Indigo
        '#7B68EE', // Bleu moyen
        '#9370DB', // Violet moyen
        '#8B008B', // Magenta foncé
        '#00BFFF', // Bleu ciel profond
        '#1E90FF' // Bleu dodger
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
function createParticle() {
    return {
        x: Math.random() * particlesCanvas.width,
        y: 0,
        speed: BASE_PARTICLE_SPEED + Math.random() * 2, // Utiliser la constante
        radius: 2 + Math.random() * 3,
        color: getRandomColor(),
        glowIntensity: 100 + Math.random() * 50
    };
}
function animateParticles(currentTime) {
    if (!particlesCtx || !isAnimating)
        return;
    // Limiter le FPS
    if (currentTime - lastFrameTime < FRAME_TIME) {
        if (isAnimating) {
            animationFrameId = requestAnimationFrame(animateParticles);
        }
        return;
    }
    lastFrameTime = currentTime;
    // Créer des particules occasionnellement
    if (Math.random() < 0.05) {
        particles.push(createParticle());
    }
    // Limiter le nombre de particules
    if (particles.length > 50) {
        particles.shift();
    }
    // Fond noir pour le canvas des particules
    particlesCtx.fillStyle = 'black';
    particlesCtx.fillRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    // Dessiner les particules
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.y += particle.speed;
        if (particle.y > particlesCanvas.height) {
            particles.splice(i, 1);
            continue;
        }
        // Effet de glow en plusieurs couches
        // 1. Lueur externe
        particlesCtx.shadowBlur = particle.glowIntensity;
        particlesCtx.shadowColor = particle.color;
        particlesCtx.globalAlpha = 0.3;
        particlesCtx.fillStyle = particle.color;
        particlesCtx.beginPath();
        particlesCtx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
        particlesCtx.fill();
        // 2. Lueur moyenne
        particlesCtx.shadowBlur = particle.glowIntensity / 2;
        particlesCtx.globalAlpha = 0.5;
        particlesCtx.beginPath();
        particlesCtx.arc(particle.x, particle.y, particle.radius * 1.5, 0, Math.PI * 2);
        particlesCtx.fill();
        // 3. Centre brillant
        particlesCtx.shadowBlur = 0;
        particlesCtx.globalAlpha = 1;
        particlesCtx.beginPath();
        particlesCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        particlesCtx.fill();
    }
    // Gérer les interactions avec les boutons
    buttons.forEach(button => {
        // Détecter le survol
        button.isHovered = (mouseX >= button.x &&
            mouseX <= button.x + button.width &&
            mouseY >= button.y &&
            mouseY <= button.y + button.height);
        // Gérer le clic
        if (mouseJustClicked && button.isHovered) {
            console.log(`Button clicked: ${button.text}`);
            if (button.text === "PLAY") {
                stopAnimations();
                const particlesCanvas = document.getElementById('particlesCanvas');
                if (particlesCanvas) {
                    particlesCanvas.style.display = 'none';
                }
                displayPlayMenu();
            }
            else if (button.text === "QUIT") {
                stopAnimations();
                const modal = document.getElementById('optionnalModal');
                if (modal)
                    modal.innerHTML = '';
            }
        }
    });
    // Réinitialiser mouseJustClicked pour le prochain frame
    mouseJustClicked = false;
    // Dessiner les boutons
    drawButtons();
    // Dessiner le titre
    animateTitle();
    // Continuer l'animation
    if (isAnimating) {
        animationFrameId = requestAnimationFrame(animateParticles);
    }
}
export function displayParticles() {
    particlesCanvas = document.getElementById('particlesCanvas');
    if (!particlesCanvas)
        return;
    // S'assurer que l'animation précédente est arrêtée
    stopAnimations();
    particlesCtx = particlesCanvas.getContext('2d', { alpha: true });
    // Configuration pour un meilleur rendu du glow
    particlesCtx.imageSmoothingEnabled = true;
    particlesCtx.imageSmoothingQuality = 'high';
    // Fond noir initial
    particlesCtx.fillStyle = 'black';
    particlesCtx.fillRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    // Réinitialiser la position du titre avant de démarrer
    titleY = -200;
    // Démarrer l'animation
    isAnimating = true;
    animationFrameId = requestAnimationFrame(animateParticles);
}
export function displayMenu() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("gameCanvas not found");
        return;
    }
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // Fond noir sur le canvas principal
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
    // Initialiser le canvas des particules
    displayParticles();
    // S'assurer que le canvas des particules a les mêmes dimensions
    if (particlesCanvas) {
        particlesCanvas.width = cw;
        particlesCanvas.height = ch;
        // Attendre que le canvas soit prêt
        setTimeout(() => {
            createButtons();
            console.log("Buttons created and listeners set up after delay");
        }, 500);
    }
    else {
        console.error("particlesCanvas is still null after displayParticles()");
    }
    // Capture de la position de la souris globale
    document.addEventListener('mousemove', (e) => {
        const rect = particlesCanvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    document.addEventListener('mousedown', () => {
        mousePressed = true;
    });
    document.addEventListener('mouseup', () => {
        if (mousePressed) {
            mouseJustClicked = true;
        }
        mousePressed = false;
    });
}
window.addEventListener('DOMContentLoaded', () => {
    const btnTri = document.getElementById('btnTriPong');
    if (!btnTri) {
        console.warn('btnTriPong introuvable dans le DOM');
        return;
    }
    btnTri.addEventListener('click', () => {
        const input = document.getElementById('usernameInput');
        const username = input && input.value.trim() !== ''
            ? input.value.trim()
            : 'Player';
        initTriPong(username);
    });
});
export function stopAnimations() {
    // Supprimer l'overlay s'il existe
    const overlays = document.querySelectorAll('div[style*="z-index: 1000"]');
    overlays.forEach(overlay => document.body.removeChild(overlay));
    isAnimating = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }
    // Nettoyer le canvas
    if (particlesCtx) {
        particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
        particlesCtx.fillStyle = 'black';
        particlesCtx.fillRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    }
    // Réinitialiser les variables
    particles.length = 0;
    titleY = -200;
    // Réinitialiser les variables de souris
    mouseX = 0;
    mouseY = 0;
    mousePressed = false;
    mouseJustClicked = false;
}
function createButtons() {
    const buttonWidth = 200;
    const buttonHeight = 60;
    const spacing = 20;
    const startY = particlesCanvas.height / 2 + 50;
    buttons.push({
        x: (particlesCanvas.width - buttonWidth) / 2,
        y: startY + buttonHeight + spacing,
        width: buttonWidth,
        height: buttonHeight,
        text: "PLAY",
        isHovered: false,
        isClicked: false
    });
    buttons.push({
        x: (particlesCanvas.width - buttonWidth) / 2,
        y: startY + (buttonHeight + spacing) * 2,
        width: buttonWidth,
        height: buttonHeight,
        text: "QUIT",
        isHovered: false,
        isClicked: false
    });
}
function drawButtons() {
    if (!particlesCtx)
        return;
    buttons.forEach(button => {
        particlesCtx.save();
        // Fond du bouton
        particlesCtx.fillStyle = button.isHovered ? '#00FFFF' : '#4B0082';
        particlesCtx.globalAlpha = button.isHovered ? 0.8 : 0.6;
        // Effet de clic
        if (button.isClicked) {
            particlesCtx.translate(0, 2);
        }
        // Dessiner le bouton avec coins arrondis
        roundRect(particlesCtx, button.x, button.y, button.width, button.height, 10);
        // Texte du bouton
        particlesCtx.fillStyle = '#FFFFFF';
        particlesCtx.globalAlpha = 1;
        particlesCtx.font = 'bold 24px Arial';
        particlesCtx.textAlign = 'center';
        particlesCtx.textBaseline = 'middle';
        particlesCtx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
        // Effet de glow si survolé
        if (button.isHovered) {
            particlesCtx.shadowBlur = 20;
            particlesCtx.shadowColor = '#00FFFF';
            particlesCtx.strokeStyle = '#00FFFF';
            particlesCtx.lineWidth = 2;
            particlesCtx.stroke();
        }
        particlesCtx.restore();
    });
}
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}
