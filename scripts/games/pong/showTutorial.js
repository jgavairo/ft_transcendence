export function drawTutorialSolo1(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        'A / D → Move blue paddle',
        'ArrowLeft / ArrowRight → Move purple paddle',
        '',
        'RULES',
        '',
        'Each player has 3 lives',
        'If the ball goes off the court on your side, you lose a life',
        '',
        'Press enter to start'
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, H / 2 - (lines.length / 2 - i) * 28);
    });
    ctx.restore();
}
export function drawTutorialSolo2(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    // fond semi‐transparent
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // textes explicatifs
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = [
        'CONTROLS',
        '',
        'A / D → Move blue paddle',
        'ArrowLeft / ArrowRight → Move purple paddle',
        'J / L → Move yellow paddle',
        '',
        'RULES',
        '',
        'Each player has 3 lives',
        'If the ball goes off the court on your side, you lose a life',
        '',
        'Press enter to start'
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, H / 2 - (lines.length / 2 - i) * 28);
    });
    ctx.restore();
}
