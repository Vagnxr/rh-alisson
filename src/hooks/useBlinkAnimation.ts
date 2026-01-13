import { useEffect, useState, useRef } from 'react';

interface UseBlinkAnimationOptions {
  /** Intervalo base entre piscadas (ms). Default: 4000 */
  intervalMs?: number;
  /** Duracao da piscada (ms). Default: 150 */
  blinkDurationMs?: number;
  /** Variacao aleatoria adicionada ao intervalo (ms). Default: 2000 */
  randomVariationMs?: number;
}

/**
 * Hook para criar animacao de "piscar" alternando entre dois estados.
 * Retorna true quando deve mostrar o estado "fechado" (piscando).
 *
 * @example
 * const isBlinking = useBlinkAnimation();
 * const src = isBlinking ? '/eyes-closed.png' : '/eyes-open.png';
 */
export function useBlinkAnimation(options: UseBlinkAnimationOptions = {}) {
  const {
    intervalMs = 4000,
    blinkDurationMs = 150,
    randomVariationMs = 2000,
  } = options;

  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), blinkDurationMs);
    };

    const scheduleNext = () => {
      // Intervalo aleatorio para parecer mais natural
      const randomDelay = intervalMs + Math.random() * randomVariationMs;
      timeoutRef.current = setTimeout(() => {
        blink();
        scheduleNext();
      }, randomDelay);
    };

    // Inicia o ciclo
    scheduleNext();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [intervalMs, blinkDurationMs, randomVariationMs]);

  return isBlinking;
}
