import { useEffect, useState } from 'react';

export function useLiveSeries(
  initial: number[] | null,
  opts: { min?: number; max?: number; drift?: number; interval?: number; length?: number } = {},
) {
  const { min = 0.4, max = 1, drift = 0.06, interval = 1400, length = 32 } = opts;
  const [data, setData] = useState<number[]>(() => {
    if (initial && initial.length >= length) {
      return initial.slice(-length);
    }
    if (initial && initial.length > 0) {
      return initial;
    }
    const seed: number[] = [];
    let v = (min + max) / 2;
    for (let i = 0; i < length; i++) {
      v = Math.max(min, Math.min(max, v + (Math.random() - 0.5) * drift * 2));
      seed.push(v);
    }
    return seed;
  });

  useEffect(() => {
    if (initial && initial.length > 0) {
      setData(initial.length >= length ? initial.slice(-length) : initial);
    }
  }, [initial, length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setData((d) => {
        const next = d[d.length - 1] + (Math.random() - 0.45) * drift;
        const clamped = Math.max(min, Math.min(max, next));
        return [...d.slice(1), clamped];
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [min, max, drift, interval]);

  return data;
}
