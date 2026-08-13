import { useRef } from 'react';
import { MarketTicker } from './MarketTicker';
import { useParticleCanvas } from './useParticleCanvas';
import { useTypewriter } from './useTypewriter';
import logotipo from '@/assets/logotipo-novo.png';

const PHOTO_URL =
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&q=90';

export function LoginLeftPanel() {
  const panelRef = useRef<HTMLElement>(null);
  const canvasRef = useParticleCanvas(panelRef);
  const { staticText, dynamicText } = useTypewriter();

  return (
    <aside className="left" ref={panelRef}>
      <div className="left-photo" style={{ backgroundImage: `url('${PHOTO_URL}')` }} />
      <div className="left-overlay" />
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden />

      <div className="left-inner">
        {/* Arte oficial (lockup horizontal). Altura fixa + width auto preserva
            a proporcao 3.9:1 — a imagem nunca e esticada. Este painel tem fundo
            escuro nos dois temas, entao o gradiente do logo mantem contraste. */}
        <div className="brand">
          <img src={logotipo} alt="MSystem" className="brand-logo" />
        </div>

        <div className="hero">
          <h1 className="hero-title">
            Gestão completa
            <br />
            do seu <em>negócio</em>
          </h1>
          <div className="typewriter-wrap">
            <span>{staticText}</span>
            <span className="typewriter-text">{dynamicText}</span>
            <span className="cursor" />
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-num">12k+</div>
              <div className="stat-label">Empresas ativas</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">99%</div>
              <div className="stat-label">Uptime garantido</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">4.9</div>
              <div className="stat-label">Avaliação média</div>
            </div>
          </div>
        </div>

        <MarketTicker />
      </div>
    </aside>
  );
}
