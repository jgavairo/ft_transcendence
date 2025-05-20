export function drawTutorialSolo1(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  // fond semi-transparent
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W, H);

  // paramètres de texte
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px "Press Start 2P"';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 8;

  const lines = [
    { text: 'CONTROLS', isTitle: true },
    { text: '' },
    { text: 'A / D → Move blue paddle' },
    { text: '← / → → Move purple paddle' },
    { text: '' },
    { text: 'RULES', isTitle: true },
    { text: '' },
    { text: 'Each player has 3 lives' },
    { text: 'If the ball exits nearest your side, you lose a life' },
    { text: '' },
    { text: '' },
    { text: 'Press ENTER to start', isTitle: true }
  ];

  // palette pour titres
  const titleColors = ['#00FFFF', '#9400D3', '#00BFFF'];
  // couleur unique pour le contenu
  const contentColor = '#FFFFFF';

  let titleIndex = 0;
  lines.forEach((line, i) => {
    if (!line.text) return; // ligne vide
    const y = H / 2 + (i - lines.length / 2) * 32;

    if (line.isTitle) {
      // couleur cycled pour les titres
      const color = titleColors[titleIndex % titleColors.length];
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.font = 'bold 28px "Press Start 2P"';
      titleIndex++;
    } else {
      // texte normal en couleur unique
      ctx.fillStyle = contentColor;
      ctx.strokeStyle = '#111';
      ctx.font = '20px "Press Start 2P"';
    }

    ctx.strokeText(line.text, W / 2, y);
    ctx.fillText(line.text, W / 2, y);
  });

  ctx.restore();
}


export function drawTutorialSolo2(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width;
  const H = canvas.height;

  ctx.save();
  // fond semi-transparent
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, W, H);

  // paramètres de texte
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px "Press Start 2P"';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 8;

  const lines = [
    { text: 'CONTROLS', isTitle: true },
    { text: '' },
    { text: 'A / D → Move blue paddle' },
    { text: '← / → → Move purple paddle' },
    { text: 'J / L → Move yellow paddle' },
    { text: '' },
    { text: 'RULES', isTitle: true },
    { text: '' },
    { text: 'Each player has 3 lives' },
    { text: 'If the ball exits nearest your side, you lose a life' },
    { text: '' },
    { text: '' },
    { text: 'Press ENTER to start', isTitle: true }
  ];

  // palette pour titres
  const titleColors = ['#00FFFF', '#9400D3', '#00BFFF'];
  // couleur unique pour le contenu
  const contentColor = '#FFFFFF';

  let titleIndex = 0;
  lines.forEach((line, i) => {
    if (!line.text) return; // ligne vide
    const y = H / 2 + (i - lines.length / 2) * 32;

    if (line.isTitle) {
      // couleur cycled pour les titres
      const color = titleColors[titleIndex % titleColors.length];
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.font = 'bold 28px "Press Start 2P"';
      titleIndex++;
    } else {
      // texte normal en couleur unique
      ctx.fillStyle = contentColor;
      ctx.strokeStyle = '#111';
      ctx.font = '20px "Press Start 2P"';
    }

    ctx.strokeText(line.text, W / 2, y);
    ctx.fillText(line.text, W / 2, y);
  });

  ctx.restore();
}
