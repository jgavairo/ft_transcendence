export function startTriPong(): void {
    const canvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    const ctx    = canvas.getContext('2d')!;
    const cw     = canvas.clientWidth;
    const ch     = canvas.clientHeight;
    canvas.width = cw;
    canvas.height= ch;
  
    const paddleLength = 150;
    const half = Math.min(cw, ch) * 0.4;
    const centerX = cw/2, centerY = ch/2;
  
    const paddleAngles = [Math.PI/2, -Math.PI/6, 7*Math.PI/6] as const;
    const paddleStates = paddleAngles.map(angle => ({
      angle,
      offset: 0 
    })) as { angle:number, offset:number }[];
  
    let ball = {
      x: centerX,
      y: centerY,
      vx: 4,
      vy: 2,
      radius: 8
    };
  
    function loop() {
      ctx.clearRect(0, 0, cw, ch);
  
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a1 = paddleAngles[i];
        const a2 = paddleAngles[(i+1)%3];
        const x1 = centerX + half * Math.cos(a1);
        const y1 = centerY - half * Math.sin(a1);
        const x2 = centerX + half * Math.cos(a2);
        const y2 = centerY - half * Math.sin(a2);
        if (i===0) ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
      }
      ctx.closePath();
      ctx.stroke();
  
      paddleStates.forEach(({angle, offset}) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-angle);
        ctx.fillStyle = 'white';
        ctx.fillRect(-paddleLength/2, half - 10 + offset, paddleLength, 10);
        ctx.restore();
      });
  
      ball.x += ball.vx;
      ball.y += ball.vy;
  
      paddleAngles.forEach((angle, i) => {
        const dx =  (ball.x - centerX)*Math.cos(angle) + (ball.y - centerY)*Math.sin(angle);
        const dy = -(ball.x - centerX)*Math.sin(angle) + (ball.y - centerY)*Math.cos(angle);
        if (dy - ball.radius <= -half) {
          ball.vy = -ball.vy;
        }
      });
  
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
      ctx.fill();
  
      requestAnimationFrame(loop);
    }
  
    loop();
  
    window.onkeydown = e => {
      if (e.key==='z') paddleStates[0].offset = -10;
      if (e.key==='s') paddleStates[0].offset = +10;
  
      if (e.key==='i') paddleStates[1].offset = -10;
      if (e.key==='k') paddleStates[1].offset = +10;
  
      if (e.key==='ArrowLeft')  paddleStates[2].offset = -10;
      if (e.key==='ArrowRight') paddleStates[2].offset = +10;
    };
    window.onkeyup = e => {
      if (['z','s'].includes(e.key)) paddleStates[0].offset = 0;
      if (['i','k'].includes(e.key)) paddleStates[1].offset = 0;
      if (['ArrowLeft','ArrowRight'].includes(e.key)) paddleStates[2].offset = 0;
    };
  }
  