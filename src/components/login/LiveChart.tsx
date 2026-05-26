type LiveChartProps = { data: number[] };

export function LiveChart({ data }: LiveChartProps) {
  const W = 600;
  const H = 110;
  const P = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (W - P * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = P + i * step;
    const y = P + (1 - (v - min) / range) * (H - P * 2);
    return [x, y] as const;
  });

  const path = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = points[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');

  const area = `${path} L ${W - P},${H - P} L ${P},${H - P} Z`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="loginChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="loginChartLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="0.6" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="1" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={P}
          x2={W - P}
          y1={P + t * (H - P * 2)}
          y2={P + t * (H - P * 2)}
          stroke="var(--border)"
          strokeDasharray="2 4"
          strokeWidth="0.6"
          opacity="0.6"
        />
      ))}
      <path d={area} fill="url(#loginChartFill)" />
      <path
        d={path}
        fill="none"
        stroke="url(#loginChartLine)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="var(--accent)" />
      <circle cx={last[0]} cy={last[1]} r="7" fill="var(--accent)" opacity="0.18">
        <animate attributeName="r" values="5;10;5" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
