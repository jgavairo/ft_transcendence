export function drawTutorial(canvas, ctx) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    // fond semi‐transparent
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    // textes explicatifs
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = [
        'CONTROLS',
        '',
        'A / D → Move your paddle',
        'ArrowLeft / ArrowRight → Move opponent paddle (in solo)',
        '',
        'Press any key to start'
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, H / 2 - (lines.length / 2 - i) * 28);
    });
    ctx.restore();
}
