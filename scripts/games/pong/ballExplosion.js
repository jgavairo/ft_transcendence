import { ctx } from "./pongGame.js";
const CW = 1200;
const CH = 800;
/** Tableau global de toutes les particules actives */
export let explosion = [];
/**
 * Crée plusieurs particules autour de (cx, cy).
 * Chaque particule reçoit une vitesse (vx, vy) aléatoire.
 */
export function createExplosion(cx, cy) {
    // Générer entre 10 et 19 particules
    const numParticles = 10 + Math.floor(Math.random() * 10);
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2; // entre 1 et 3 px/frame
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        explosion.push({
            x: cx + (Math.random() - 0.5) * 10, // légère dispersion initiale
            y: cy + (Math.random() - 0.5) * 10,
            vx,
            vy,
            alpha: 1,
            size: 4 + Math.random() * 4, // taille entre 4 et 8 px
            color: "orange"
        });
    }
}
/**
 * Boucle d’animation qui dessine et met à jour toutes les particules.
 * Elle s’appelle récursivement via requestAnimationFrame.
 */
export function animateExplosion() {
    // Parcours à l’envers pour pouvoir splicer sans casser les indices
    for (let i = explosion.length - 1; i >= 0; i--) {
        const p = explosion[i];
        if (!p) {
            explosion.splice(i, 1);
            continue;
        }
        // 1) Dessiner la particule
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // 2) Mettre à jour position (x, y)
        p.x += p.vx;
        p.y += p.vy;
        // 3) Diminuer progressivement l’opacité
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
            // Retirer la particule si elle devient invisible
            explosion.splice(i, 1);
        }
    }
    // Replanifier la prochaine frame
    requestAnimationFrame(animateExplosion);
}
// Démarrer l’animation une seule fois lors du chargement du module
animateExplosion();
