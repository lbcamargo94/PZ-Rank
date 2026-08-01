const COLORS = [
  '#7EC255', '#5E9040', '#C8902A', '#E89830',
  '#C8902A', '#EDE5D0', '#ffffff', '#C87820',
];

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  w: number; h: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  shape: 'rect' | 'circle';
}

export function burstConfetti(originX: number, originY: number, count = 90) {
  const canvas = document.createElement('canvas');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;

  const particles: Particle[] = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 10;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.25,
      alpha: 1,
      shape: Math.random() > 0.45 ? 'rect' : 'circle',
    };
  });

  let raf: number;

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      p.vy    += 0.3;   // gravidade
      p.vx    *= 0.99;  // resistência do ar
      p.x     += p.vx;
      p.y     += p.vy;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.014;

      if (p.alpha <= 0) continue;
      alive = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }

      ctx.restore();
    }

    if (alive) {
      raf = requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }

  raf = requestAnimationFrame(tick);

  // Segurança: remove o canvas após 4s mesmo se algo travar
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, 4000);
}
