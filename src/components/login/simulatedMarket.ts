export type MarketKey =
  | 'IBOV'
  | 'SP500'
  | 'NASDAQ'
  | 'SELIC'
  | 'CDI'
  | 'USD'
  | 'EUR'
  | 'DOLFUT'
  | 'BTC'
  | 'OURO'
  | 'PETR4'
  | 'VALE3'
  | 'ITUB4';

export type MarketEntry = {
  val: number;
  chg: number;
  fmt: 'pts' | '%' | 'R$';
  label: string;
};

export const SIMULATED_MARKET: Record<MarketKey, MarketEntry> = {
  IBOV: { val: 128450, chg: 0.82, fmt: 'pts', label: 'IBOVESPA' },
  SP500: { val: 5312, chg: 0.41, fmt: 'pts', label: 'S&P 500' },
  NASDAQ: { val: 16840, chg: 0.58, fmt: 'pts', label: 'NASDAQ' },
  SELIC: { val: 10.5, chg: 0, fmt: '%', label: 'SELIC a.a.' },
  CDI: { val: 10.4, chg: 0, fmt: '%', label: 'CDI a.a.' },
  USD: { val: 5.18, chg: -0.31, fmt: 'R$', label: 'USD/BRL' },
  EUR: { val: 5.62, chg: 0.15, fmt: 'R$', label: 'EUR/BRL' },
  DOLFUT: { val: 5.195, chg: -0.28, fmt: 'R$', label: 'DOL FUT' },
  BTC: { val: 312480, chg: 2.14, fmt: 'R$', label: 'BTC/BRL' },
  OURO: { val: 11620, chg: 0.62, fmt: 'R$', label: 'Ouro (g)' },
  PETR4: { val: 38.72, chg: 1.23, fmt: 'R$', label: 'PETR4' },
  VALE3: { val: 61.45, chg: -0.88, fmt: 'R$', label: 'VALE3' },
  ITUB4: { val: 34.8, chg: 0.55, fmt: 'R$', label: 'ITUB4' },
};

export const PRIMARY_TICKERS: MarketKey[] = ['IBOV', 'SP500', 'USD', 'EUR', 'SELIC', 'BTC'];

export function formatMarketVal(entry: MarketEntry): string {
  const v = entry.val;
  if (entry.fmt === 'pts') return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (entry.fmt === '%') return `${v.toFixed(2)}%`;
  if (v > 10000) return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  return `R$ ${v.toFixed(3).replace('.', ',')}`;
}

export function tickMarket(
  market: Record<MarketKey, MarketEntry>,
): {
  market: Record<MarketKey, MarketEntry>;
  flash: Partial<Record<MarketKey, 'up' | 'down'>>;
} {
  const next = { ...market } as Record<MarketKey, MarketEntry>;
  const flash: Partial<Record<MarketKey, 'up' | 'down'>> = {};
  (Object.keys(market) as MarketKey[]).forEach((key) => {
    const m = { ...market[key] };
    if (key !== 'SELIC' && key !== 'CDI') {
      const volatility =
        key === 'BTC'
          ? 0.008
          : key === 'OURO'
            ? 0.002
            : key === 'IBOV' || key === 'SP500' || key === 'NASDAQ'
              ? 0.003
              : 0.002;
      const delta = m.val * volatility * (Math.random() - 0.48);
      m.val = Math.max(0.01, m.val + delta);
      flash[key] = delta > 0 ? 'up' : 'down';
      m.chg = Math.max(-5, Math.min(5, m.chg + (Math.random() - 0.5) * 0.05));
    }
    next[key] = m;
  });
  return { market: next, flash };
}
