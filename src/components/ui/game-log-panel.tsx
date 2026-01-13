import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

export interface GameLogPanelProps {
  logs: string[];
  className?: string;
}

export function GameLogPanel({ logs, className = '' }: GameLogPanelProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      role="log"
      aria-label="Log do jogo"
      aria-live="polite"
      className={cn(
        `border-neon-purple shadow-pixel relative flex overflow-y-auto border-2 bg-void-black p-2 font-mono text-xs ${className}`,
      )}
    >
      <div
        className={cn(
          'bg-scanlines pointer-events-none absolute top-0 left-0 h-full w-full opacity-20',
        )}
      />
      <div className={cn('relative flex flex-col gap-1')}>
        {logs.map((log, i) => (
          <div
            key={i}
            role="listitem"
            className={cn(log.startsWith('>') ? 'text-neon-green' : 'text-text-muted')}
          >
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
