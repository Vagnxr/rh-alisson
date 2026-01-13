
import { Shield, Heart, Skull } from 'lucide-react';
import { cn } from '@/lib/cn';


interface OpponentCardProps {
  name: string;
  avatar: string;
  isDead?: boolean;
  hp: number;
  maxShields: number;
  shields: number;
  isActive: boolean;
}

function OpponentCard({ name, avatar, isDead, hp, maxShields, shields, isActive }: OpponentCardProps) {
  return (
    <div
      className={cn(
        'relative py-2 flex-shrink-0 w-full md:min-w-34 flex flex-col items-center transition-transform duration-300',
        isActive ? 'border-neon-yellow translate-y-2 scale-110 z-10 -mt-3' : 'border-neutral-700 opacity-90',
        isDead && 'opacity-50 grayscale border-red-900'
      )}
    >
      {isActive && (
        <div className="absolute -bottom-0 px-2 py-0.5 bg-neon-yellow text-black text-[10px] font-bold rounded-full animate-pulse">
          TURN
        </div>
      )}

      {/* Avatar Circle */}
      <div className={cn(
        "size-14 md:size-18 mb-2 rounded-full overflow-hidden border-2 shadow-lg",
        isActive ? "border-neon-yellow shadow-[0_0_10px_var(--color-neon-yellow)]" : "border-neutral-600",
        isDead && "border-red-900"
      )}>
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* Name */}
      <span className={cn(
        "text-xs font-bold truncate w-full text-center px-1 mb-2",
        isActive ? "text-white" : "text-neutral-400"
      )}>
        {name}
      </span>

      {/* Stats Row */}
      {!isDead ? (
        <div className="flex items-center justify-center gap-3 w-full bg-black/40 rounded py-1 px-1">
          {/* HP */}
          <div className="flex items-center gap-1">
            <Heart size={12} className="fill-red-500 text-red-500" />
            <span className="text-xs font-mono text-white leading-none">{hp}</span>
          </div>

          {/* Shields (se tiver) */}
          {shields > 0 && (
            <div className="flex items-center gap-1">
              <Shield size={12} className="fill-blue-400 text-blue-400" />
              <span className="text-xs font-mono text-blue-200 leading-none">{shields}/{maxShields}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-800 font-mono text-xs font-bold uppercase">
          <Skull size={14} /> DEAD
        </div>
      )}
    </div>
  );
}

export function OpponentsBar() {
  const opponents = [
    { name: "Birdperson", avatar: "/images/avatar/birdperson_md.png", hp: 1, maxShields: 6, shields: 1, active: false },
    { name: "Cromulon", avatar: "/images/avatar/cromolum_md.png", hp: 2, maxShields: 6, shields: 2, active: true },
    { name: "Squanchy", avatar: "/images/avatar/squanchy_md.png", hp: 2, maxShields: 6, shields: 1, active: false },
    { name: "Beth Smith", avatar: "/images/avatar/beth_smith_md.png", hp: 3, maxShields: 6, shields: 1, active: false },
    { name: "Morty", avatar: "/images/avatar/morty_md.png", hp: 0, maxShields: 6, shields: 0, isDead: true, active: false },
  ];

  return (
    <div className="grid grid-cols-5 max-w-3xl mx-auto gap-2 mb-4 p-4 snap-x mask-gradient-x">
      {opponents.map((opp, idx) => (
        <OpponentCard
          key={idx}
          name={opp.name}
          avatar={opp.avatar}
          hp={opp.hp}
          maxShields={opp.maxShields}
          shields={opp.shields}
          isActive={opp.active}
          isDead={opp.isDead}
        />
      ))}
    </div>
  );
}
