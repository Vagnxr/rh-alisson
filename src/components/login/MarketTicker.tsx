import { useEffect, useState } from 'react';
import {
  formatMarketVal,
  PRIMARY_TICKERS,
  SIMULATED_MARKET,
  tickMarket,
  type MarketEntry,
  type MarketKey,
} from './simulatedMarket';

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
}: {
  entry: MarketEntry;
  flash: 'up' | 'down' | undefined;
}) {
  return (
    <div className={`ticker-card${flash === 'up' ? ' flash-up' : flash === 'down' ? ' flash-down' : ''}`}>
      <div className="ticker-name">{entry.label}</div>
      <div className="ticker-val">{formatMarketVal(entry)}</div>
      <ChgBadge chg={entry.chg} />
    </div>
  );
}

export function MarketTicker() {
  const [market, setMarket] = useState(() => ({ ...SIMULATED_MARKET }));
  const [flash, setFlash] = useState<Partial<Record<MarketKey, 'up' | 'down'>>>({});

  useEffect(() => {
    const id = window.setInterval(() => {
      setMarket((prev) => {
        const { market: next, flash: nextFlash } = tickMarket(prev);
        setFlash(nextFlash);
        window.setTimeout(() => setFlash({}), 500);
        return next;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const allKeys = Object.keys(market) as MarketKey[];
  const tapeItems = [...allKeys, ...allKeys];

  return (
    <div className="market-section">
      <div className="market-label">
        <div className="pulse-dot" style={{ background: 'rgba(255,255,255,0.3)' }} />
        Mercado ao vivo
      </div>
      <div className="ticker-row">
        {PRIMARY_TICKERS.map((key) => (
          <TickerCard key={key} entry={market[key]} flash={flash[key]} />
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
