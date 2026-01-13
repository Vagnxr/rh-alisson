import type { Player } from '@/types/lobby';
import { Crown, Mic, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PlayerCardProps {
  player: Player | null;
}

const emptySlotContainerClassName = cn(
  'group relative flex w-full flex-row items-center justify-center p-3 transition-colors hover:bg-neon-green/5 overflow-hidden',
  'border-neon-green/50 bg-panel/30 rounded-xl border-2 border-dashed',
  'h-[90px] md:h-[200px] md:flex-col gap-4',
);

const occupiedContainerClassName = () =>
  cn(
    'relative flex w-full flex-row items-center overflow-hidden transition-all',
    'bg-panel rounded-xl border-3 p-2 md:p-3',
    'border-neon-green shadow-neon-green',
    'h-[90px] md:h-[200px] md:flex-col',
  );

export function PlayerCard({ player }: PlayerCardProps) {
  // EMPTY SLOT STATE
  if (!player) {
    return (
      <div className={emptySlotContainerClassName}>
        <div className="z-10 flex w-full flex-col items-center justify-center gap-2">
          {/* Invite Button (Mobile Position) */}
          <button className={cn("flex items-center gap-1 rounded-sm border border-neon-green/40 bg-neon-green/10 px-2 py-0.5 text-[10px] text-neon-green hover:bg-neon-green/20 md:static")}
            onClick={() => { }}
          >
            <Plus className="size-3" />
            INVITE
          </button>
        </div>


      </div>
    );
  }

  // OCCUPIED SLOT STATE
  return (
    <div className={occupiedContainerClassName()}>

      {/* Top/Right Controls (Chat) */}
      <div className="absolute bottom-2 md:top-2 right-2 z-20">
        <div className="flex items-center justify-center p-1 rounded-sm bg-panel/80 border border-neon-green/30 md:p-1.5">
          <Mic className="size-3 text-neon-green md:size-4" />
        </div>
      </div>

      {/* Host/Crown Icon */}
      {player.isHost && (
        <div className="absolute top-2 right-2 z-20 md:left-2">
          <div className="flex max-w-8 items-center justify-center p-1 rounded-sm bg-panel/80 border border-neon-green/30 md:p-1.5">
            <Crown className="size-3 text-neon-yellow fill-current md:size-4" />
          </div>
        </div>
      )}

      {/* Avatar Section */}
      <div className="relative z-10 flex items-center justify-center shrink-0 md:flex-1 md:w-full md:py-4">
        <div className="relative size-16 md:size-24 group">
          {/* Glow behind avatar */}
          <div className="absolute inset-0 rounded-full bg-neon-green/10 blur-xl animate-pulse" />
          <img
            src={player.avatar}
            className="relative z-10 h-full w-full object-contain pixelated drop-shadow-[0_0_10px_rgba(94,255,94,0.4)]"
            alt={player.name}
          />
        </div>
      </div>

      {/* Info Section */}
      <div className={cn(
        "relative z-20 flex flex-col md:w-full",
        "justify-center px-3 md:px-1",
        "md:bg-panel/60 md:backdrop-blur-sm",
        "md:rounded-lg md:border md:border-neon-green/20",
      )}>
        <h2 className="font-mono tracking-widest text-white uppercase text-xs md:text-center truncate">
          {player.name}
        </h2>

        <div className="flex items-center gap-2 md:justify-center">
          <span className={cn(
            "h-2 w-2 rounded-full shadow-[0_0_8px_#5eff5e]",
            player.isReady ? "bg-neon-green" : "bg-neutral-500 shadow-none"
          )} />
          <span className={cn(
            "font-mono text-[9px] tracking-wider md:text-[10px]",
            player.isReady ? "text-neon-green" : "text-neutral-500"
          )}>
            {player.isReady ? 'READY' : 'NOT READY'}
          </span>
        </div>
      </div>

      {/* Background/Vignette Effect (Desktop Only or Subtle) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.3)] md:shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-0" />
    </div>
  );
}


