import { LiveChart } from './LiveChart';
import { formatSelicMeta } from '@/lib/bcbMarket';
import { useBcbMarket } from './useBcbMarket';
import { useLiveSeries } from './useLiveSeries';

export function LiveChartBlock() {
  const { market, loading, error, ready } = useBcbMarket();

  const chartData = useLiveSeries(ready ? market.selicHistory : null, {
    length: 36,
    min: market.min,
    max: market.max,
    drift: market.drift,
    interval: 1200,
  });

  const delta = market.selicDelta;

  return (
    <div className="live rise rise-6">
      <div className="live-head">
        <span className="live-dot" />
        <span>Taxa Selic (meta)</span>
        <span className="value">
          {loading ? '—' : error ? 'Indisponível' : formatSelicMeta(market.selicLatest)}
        </span>
        {!loading && !error && (
          <span className="delta">
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2).replace('.', ',')}%
          </span>
        )}
        <span className="spacer" />
        <span style={{ fontSize: 10 }}>BCB · TEMPO REAL</span>
      </div>
      <div className="chart-wrap">
        {ready ? (
          <LiveChart data={chartData} />
        ) : (
          <div className="chart-placeholder" aria-hidden />
        )}
      </div>
      <div className="ticker">
        {(error ? [] : market.tickers).map((t) => (
          <div className="ticker-item" key={t.sym}>
            <span style={{ color: 'var(--text-3)' }}>{t.sym}</span>
            <span style={{ color: 'var(--text-1)' }}>{loading ? '…' : t.val}</span>
            {!loading && (
              <span className={t.up ? 'up' : 'down'}>{t.change}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
