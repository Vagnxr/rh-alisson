import { useEffect, useMemo, useState } from 'react';
import {
  BCB_SERIES,
  fetchBcbSeries,
  formatCdiDaily,
  formatChange,
  formatSelicMeta,
  formatUsd,
  pctChange,
  type BcbPoint,
} from '@/lib/bcbMarket';

export type MarketTicker = {
  sym: string;
  val: string;
  change: string;
  up: boolean;
};

type MarketState = {
  selicHistory: number[];
  selicLatest: number;
  selicDelta: number;
  tickers: MarketTicker[];
  min: number;
  max: number;
  drift: number;
};

const EMPTY: MarketState = {
  selicHistory: [],
  selicLatest: 0,
  selicDelta: 0,
  tickers: [],
  min: 0,
  max: 1,
  drift: 0.02,
};

function tickerFromPoints(sym: string, points: BcbPoint[], format: (v: number) => string): MarketTicker {
  const last = points[points.length - 1]?.value ?? 0;
  const prev = points[points.length - 2]?.value ?? last;
  const ch = pctChange(last, prev);
  return {
    sym,
    val: format(last),
    change: formatChange(ch),
    up: ch >= 0,
  };
}

export function useBcbMarket() {
  const [market, setMarket] = useState<MarketState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [selic, cdi, usd, ipca] = await Promise.all([
          fetchBcbSeries(BCB_SERIES.selic, 20),
          fetchBcbSeries(BCB_SERIES.cdi, 2),
          fetchBcbSeries(BCB_SERIES.usd, 2),
          fetchBcbSeries(BCB_SERIES.ipca12, 2),
        ]);

        if (cancelled) return;

        const values = selic.map((p) => p.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const pad = Math.max(0.15, (max - min) * 0.15);
        const last = values[values.length - 1] ?? 0;
        const prev = values[values.length - 2] ?? last;

        setMarket({
          selicHistory: values,
          selicLatest: last,
          selicDelta: pctChange(last, prev),
          min: min - pad,
          max: max + pad,
          drift: 0.015,
          tickers: [
            tickerFromPoints('SELIC', selic.slice(-2), formatSelicMeta),
            tickerFromPoints('CDI', cdi, formatCdiDaily),
            tickerFromPoints('USD', usd, formatUsd),
            tickerFromPoints('IPCA 12M', ipca, (v) => `${v.toFixed(2).replace('.', ',')}%`),
          ],
        });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const refresh = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, []);

  const ready = useMemo(() => market.selicHistory.length > 0, [market.selicHistory.length]);

  return { market, loading, error, ready };
}
