export function displayMatchFound(message) {
    const canvas = document.getElementById('pongCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    // Fond sombre
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cw, ch);
    // Texte « Match Found »
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Match Found', cw / 2, ch * 0.3);
    // Le message A vs B (ou A vs B vs C)
    ctx.font = '24px Arial';
    ctx.fillText(message, cw / 2, ch * 0.5);
    // Optionnel : invite à patienter
    ctx.font = '18px Arial';
    ctx.fillText('Waiting for players...', cw / 2, ch * 0.7);
}
