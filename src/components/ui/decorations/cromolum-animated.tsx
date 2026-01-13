import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/cn';

type Expression = 'normal' | 'drooling';
type EyeState = 'open' | 'closed';

interface CromolumState {
  expression: Expression;
  eyes: EyeState;
}

const IMAGES: Record<Expression, Record<EyeState, string>> = {
  normal: {
    open: '/images/animation/pillmolum_eo.png',
    closed: '/images/animation/pillmolum_ec.png',
  },
  drooling: {
    open: '/images/animation/pillmolum_drooling_eo.png',
    closed: '/images/animation/pillmolum_drooling_ec.png',
  },
};

interface CromolumAnimatedProps {
  /** Tamanho do componente. Default: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Rotacao em graus. Default: -12 */
  rotation?: number;
  /** Ativar animacao de glow. Default: true */
  glowEnabled?: boolean;
  /** Ativar animacao de flutuacao. Default: true */
  floatEnabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

const sizeClasses = {
  sm: 'size-32',
  md: 'size-50',
  lg: 'size-64',
};

/**
 * Cromolum Animado - Personagem decorativo com animacoes de piscar e expressoes
 *
 * Comportamentos:
 * - Pisca naturalmente em intervalos aleatorios (3-7s)
 * - As vezes pisca 2x rapido (double blink)
 * - Muda expressao esporadicamente (normal <-> drooling)
 * - Glow roxo pulsante
 * - Flutuacao suave no espaco
 */
export function CromolumAnimated({
  size = 'md',
  rotation = -12,
  glowEnabled = true,
  floatEnabled = true,
  className,
}: CromolumAnimatedProps) {
  const [state, setState] = useState<CromolumState>({
    expression: 'normal',
    eyes: 'open',
  });

  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expressionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Funcao para piscar uma vez
  const blink = useCallback((duration: number = 120) => {
    setState(s => ({ ...s, eyes: 'closed' }));
    setTimeout(() => {
      setState(s => ({ ...s, eyes: 'open' }));
    }, duration);
  }, []);

  // Funcao para double blink (mais natural)
  const doubleBlink = useCallback(() => {
    blink(100);
    setTimeout(() => blink(80), 200);
  }, [blink]);

  // Ciclo de piscar
  useEffect(() => {
    const scheduleNextBlink = () => {
      // Intervalo aleatorio entre 3-7 segundos
      const baseInterval = 3000 + Math.random() * 4000;

      blinkTimeoutRef.current = setTimeout(() => {
        // 20% de chance de double blink
        if (Math.random() < 0.2) {
          doubleBlink();
        } else {
          // Duracao do blink varia um pouco (100-150ms)
          blink(100 + Math.random() * 50);
        }
        scheduleNextBlink();
      }, baseInterval);
    };

    scheduleNextBlink();

    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, [blink, doubleBlink]);

  // Ciclo de mudanca de expressao
  useEffect(() => {
    const scheduleExpressionChange = () => {
      // Muda expressao a cada 8-15 segundos
      const interval = 8000 + Math.random() * 7000;

      expressionTimeoutRef.current = setTimeout(() => {
        setState(s => ({
          ...s,
          expression: s.expression === 'normal' ? 'drooling' : 'normal',
        }));
        scheduleExpressionChange();
      }, interval);
    };

    // Comeca com expressao normal, muda depois de um tempo
    const initialDelay = 5000 + Math.random() * 5000;
    expressionTimeoutRef.current = setTimeout(() => {
      setState(s => ({ ...s, expression: 'drooling' }));
      scheduleExpressionChange();
    }, initialDelay);

    return () => {
      if (expressionTimeoutRef.current) {
        clearTimeout(expressionTimeoutRef.current);
      }
    };
  }, []);

  const imageSrc = IMAGES[state.expression][state.eyes];

  return (
    <div
      className={cn(floatEnabled && 'animate-float')}
      style={{ '--float-rotation': `${rotation}deg` } as React.CSSProperties}
    >
      <img
        src={imageSrc}
        alt="Cromulon"
        className={cn(
          sizeClasses[size],
          'object-contain select-none',
          glowEnabled && 'animate-glow-purple',
          className,
          'png-outline',
        )}
        style={!floatEnabled ? { transform: `rotate(${rotation}deg)` } : undefined}
        draggable={false}
      />
    </div>
  );
}
