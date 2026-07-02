import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  decay: number;
};

export function useParticleCanvas(panelRef: React.RefObject<HTMLElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!panel || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let frameId = 0;

    const createParticle = (): Particle => ({
      x: Math.random() * w,
      y: h + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.5 + 0.15),
      r: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.25 + 0.05,
      life: 1,
      decay: Math.random() * 0.0015 + 0.0008,
    });

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    resize();
    particlesRef.current = Array.from({ length: 45 }, () => {
      const p = createParticle();
      p.y = Math.random() * h;
      return p;
    });

    const draw = () => {
      const { x: mouseX, y: mouseY } = mouseRef.current;
      ctx.clearRect(0, 0, w, h);
      particlesRef.current.forEach((p, i) => {
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 80 && md > 0) {
          p.vx += (mdx / md) * 0.3;
          p.vy += (mdy / md) * 0.3;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -20) {
          particlesRef.current[i] = createParticle();
          return;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,197,94,${p.alpha * p.life})`;
        ctx.fill();
      });
      frameId = requestAnimationFrame(draw);
    };

    panel.addEventListener('mousemove', onMove);
    panel.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      panel.removeEventListener('mousemove', onMove);
      panel.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, [panelRef]);

  return canvasRef;
}
