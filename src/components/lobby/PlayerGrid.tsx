import type { Player } from '@/types/lobby';
import { PlayerCard } from './PlayerCard';
import { cn } from '@/lib/cn';

interface PlayerGridProps {
  players: (Player | null)[];
  className?: string;
}

export function PlayerGrid({ players, className }: PlayerGridProps) {
  return (
    <div className={cn(
      "grid h-full grid-cols-1 gap-2 md:grid-cols-6 md:gap-4",
      "p-4",
      className
    )}>
      {players.map((player, index) => (
        <PlayerCard key={index} player={player} />
      ))}
    </div>
  );
}
