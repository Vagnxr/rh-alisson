import { AnimatedNumber } from './AnimatedNumber';
import { LiveChartBlock } from './LiveChartBlock';
import { MSystemMark } from './icons';

export function LoginLeftPanel() {
  return (
    <aside className="left">
      <header className="brand rise rise-1">
        <span className="brand-mark">
          <MSystemMark size={26} />
        </span>
        <span className="brand-name">MSystem</span>
        <span className="brand-meta">
          <span className="dot" />
Versão
          <span style={{ opacity: 0.5, marginLeft: 2 }}>1.0</span>
        </span>
      </header>

      <div className="hero">
        <span className="eyebrow rise rise-2">
          <span className="dot" />
          Gestão financeira
        </span>
        <h1 className="headline rise rise-3">
          Gestão completa do seu <em>negócio</em>.
        </h1>
        <p className="sub rise rise-4">
          Controle vendas, estoque, fluxo de caixa e equipe, da sua conveniência ao seu
          supermercado, com a clareza de quem entende cada centavo.
        </p>

        <div className="stats rise rise-5">
          <div className="stat">
            <div className="stat-value">
              <AnimatedNumber value={12.4} format={v => v.toFixed(1)} />
              <span className="unit">k+</span>
            </div>
            <div className="stat-label">Empresas ativas</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              <AnimatedNumber value={99.98} format={v => v.toFixed(2)} />
              <span className="unit">%</span>
            </div>
            <div className="stat-label">Uptime em 12 meses</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              <AnimatedNumber value={4.9} format={v => v.toFixed(1)} />
              <span className="unit">/5</span>
            </div>
            <div className="stat-label">Avaliação média</div>
          </div>
        </div>
      </div>

      <LiveChartBlock />
    </aside>
  );
}
