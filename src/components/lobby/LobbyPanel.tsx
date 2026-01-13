import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ScrollArea } from '../ui/scroll-area';

export type LobbyPanelProps = {
  children: ReactNode;
  className?: string;
};

export function LobbyPanel({ children, className }: LobbyPanelProps) {
  return (
    <ScrollArea
      className={cn(
        'p-0',
        className,
      )}

    >
      {children}
    </ScrollArea>
  );
}
