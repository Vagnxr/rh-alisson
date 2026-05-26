import { useEffect, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  format?: (v: number) => string;
};

export function AnimatedNumber({ value, format = (v) => v.toFixed(1) }: AnimatedNumberProps) {
  const [v, setV] = useState(value * 0.6);

  useEffect(() => {
    const start = performance.now();
    const from = v;
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - (1 - p) ** 3;
      setV(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- anima apenas quando `value` muda
  }, [value]);

  return <>{format(v)}</>;
}
