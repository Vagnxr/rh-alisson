import { useEffect, useState } from 'react';

/**
 * True quando o usuario pediu movimento reduzido no sistema.
 *
 * Use para nao agendar animacoes (intervalos, rAF) em vez de apenas escondê-las:
 * animacao que continua rodando invisivel ainda gasta bateria e CPU.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const onChange = () => setPrefersReduced(media.matches);
    onChange();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  return prefersReduced;
}
