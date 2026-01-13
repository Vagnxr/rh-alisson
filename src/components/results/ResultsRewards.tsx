import { Package, Skull } from 'lucide-react';

export interface ResultsXpBarProps {
  isVictory: boolean;
  value: number;
}

export function ResultsXpBar({ isVictory, value }: ResultsXpBarProps) {
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs font-pixel uppercase mb-1">
        <span className={isVictory ? 'text-green-400' : 'text-red-400'}>
          {isVictory ? 'XP GAINED' : 'XP LOST'}
        </span>
        <span className="text-white font-normal">{isVictory ? `+${value}` : `-${value}`}</span>
      </div>
      <div className="h-4 w-full bg-black border-2 border-slate-600 rounded-full overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-size-[4px_4px]" />

        {/* Bar Fill */}
        <div
          className={`h-full transition-all duration-1000 ${
            isVictory
              ? 'bg-linear-to-r from-yellow-400 to-yellow-600 w-[80%]'
              : 'bg-red-900 w-[30%]'
          }`}
        />
      </div>
    </div>
  );
}

interface LootDisplayProps {
  isVictory: boolean;
}

function LootDisplay({ isVictory }: LootDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center mt-4 p-2 rounded-lg bg-black/20 w-full">
      <div className="w-16 h-16 mb-2 flex items-center justify-center animate-bounce">
        {isVictory ? (
          <Package size={44} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.35)]" />
        ) : (
          <Skull size={44} className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.35)]" />
        )}
      </div>

      <div className="text-center">
        {isVictory ? (
          <>
            <div className="text-cyan-400 font-pixel text-sm animate-pulse">COOL RICK SUNGLASSES</div>
            <div className="text-yellow-500 font-pixel text-[10px] uppercase tracking-widest mt-1">
              New Cosmetic Unlocked!
            </div>
          </>
        ) : (
          <>
            <div className="text-slate-500 font-pixel text-sm line-through">NO LOOT</div>
            <div className="text-red-500 font-pixel text-[10px] uppercase tracking-widest mt-1">
              Better luck next timeline
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export interface ResultsRewardsProps {
  isVictory: boolean;
}

export function ResultsRewards({ isVictory }: ResultsRewardsProps) {
  return (
    <div
      className={
        `
        bg-slate-900/80 border-4 rounded-xl p-4 flex flex-col shadow-lg relative overflow-hidden
        ${isVictory ? 'border-yellow-600' : 'border-slate-600'}
      `
      }
    >
      <h3
        className={
          `
          text-center text-xl uppercase mb-2 border-b-2 border-slate-700 pb-2
          ${isVictory ? 'text-yellow-400' : 'text-slate-400'}
        `
        }
      >
        Rewards
      </h3>

      <ResultsXpBar isVictory={isVictory} value={isVictory ? 1200 : 500} />

      <div className="flex-1 flex flex-col justify-end">
        <LootDisplay isVictory={isVictory} />
      </div>
    </div>
  );
}
