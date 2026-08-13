import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  formatMarketVal,
  PRIMARY_TICKERS,
  SIMULATED_MARKET,
  tickMarket,
  type MarketEntry,
  type MarketKey,
} from './simulatedMarket';

/**
 * Atraso entre um card e o seguinte, em ms.
 *
 * Todos os cards recebem flash no mesmo tick; sem escalonamento eles piscavam
 * em unissono, com aparencia de farol. O atraso e deterministico (posicao do
 * card), nunca aleatorio, para o ritmo nao mudar a cada render.
 */
const ATRASO_POR_CARD_MS = 120;

function ChgBadge({ chg }: { chg: number }) {
  const dir = chg > 0 ? 'up' : chg < 0 ? 'down' : '';
  const arrow = chg > 0 ? '▲' : chg < 0 ? '▼' : '—';
  return (
    <div className={`ticker-chg ${dir}`}>
      {arrow} {Math.abs(chg).toFixed(2)}%
    </div>
  );
}

function TickerCard({
  entry,
  flash,
  delayMs,
}: {
  entry: MarketEntry;
  flash: 'up' | 'down' | undefined;
  delayMs: number;
}) {
  // O atraso vai por CSS var no transition-delay: e o CSS que escalona, entao um
  // re-render comum do React nao reinicia nem reordena a animacao.
  const style = { '--flash-delay': `${delayMs}ms` } as CSSProperties;
  return (
    <div
      style={style}
      className={`ticker-card${flash === 'up' ? ' flash-up' : flash === 'down' ? ' flash-down' : ''}`}
    >
      <div className="ticker-name">{entry.label}</div>
      <div className="ticker-val">{formatMarketVal(entry)}</div>
      <ChgBadge chg={entry.chg} />
    </div>
  );
}

export function MarketTicker() {
  const [market, setMarket] = useState(() => ({ ...SIMULATED_MARKET }));
  const [flash, setFlash] = useState<Partial<Record<MarketKey, 'up' | 'down'>>>({});
  const prefersReducedMotion = usePrefersReducedMotion();
  const limparFlashRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Movimento reduzido: mercado fica estatico, sem intervalo agendado.
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      const { market: next, flash: nextFlash } = tickMarket(market);
      setMarket(next);
      setFlash(nextFlash);
      // Limpa o flash depois que o ultimo card ja acendeu.
      window.clearTimeout(limparFlashRef.current);
      limparFlashRef.current = window.setTimeout(
        () => setFlash({}),
        500 + PRIMARY_TICKERS.length * ATRASO_POR_CARD_MS,
      );
    }, 2200);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(limparFlashRef.current);
    };
    // `market` e lido dentro do intervalo; recriar o intervalo a cada tick e
    // aceitavel aqui e evita o setState-dentro-do-updater anterior, que rodava
    // duas vezes em StrictMode.
  }, [market, prefersReducedMotion]);

  const allKeys = Object.keys(market) as MarketKey[];
  const tapeItems = [...allKeys, ...allKeys];

  return (
    <div className="market-section">
      <div className="market-label">
        <div className="pulse-dot" style={{ background: 'rgba(255,255,255,0.3)' }} />
        Mercado ao vivo
      </div>
      <div className="ticker-row">
        {PRIMARY_TICKERS.map((key, i) => (
          <TickerCard
            key={key}
            entry={market[key]}
            flash={flash[key]}
            delayMs={i * ATRASO_POR_CARD_MS}
          />
        ))}
      </div>
      <div className="tape-wrap">
        <div className="tape">
          {tapeItems.map((key, i) => {
            const m = market[key];
            const dir = m.chg > 0 ? 'up' : m.chg < 0 ? 'down' : '';
            const arrow = m.chg > 0 ? '▲' : m.chg < 0 ? '▼' : '—';
            return (
              <span className="tape-item" key={`${key}-${i}`}>
                <strong>{m.label}</strong>
                <span>{formatMarketVal(m)}</span>
                <span className={dir}>
                  {arrow} {Math.abs(m.chg).toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
