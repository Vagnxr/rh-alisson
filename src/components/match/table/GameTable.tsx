
import { Pill } from './Pill';
import { useGameStore } from '@/stores/gameStore';
import { postSystemMessage } from '@/lib/systemMessages';
import type { IPill } from '@/types/game';

export function GameTable() {
  const tablePills = useGameStore(state => state.tablePills);
  const choosePill = useGameStore(state => state.choosePill);

  const handlePillClick = (id: string, type: IPill['type']) => {
    postSystemMessage('match', `> Rick Sanchez took a pill... it was ${type}!`);
    choosePill(id, type);
  };

  // Divide em duas linhas para visual de esteira
  const row1 = tablePills.slice(0, 6);
  const row2 = tablePills.slice(6, 12);

  return (
    <div className="flex flex-1 flex-col max-w-2xl items-center justify-center p-2 mx-2 md:p-4 mb-4 bg-neutral-800/30 rounded-xl relative shadow-xl">
      {/* Header da Mesa */}
      <div className="absolute -top-5 bg-panel px-4 py-1 border-2 border-neon-green text-neon-green rounded shadow-[0_0_10px_var(--color-neon-green)] font-display tracking-wider z-20">
        THE TABLE
      </div>

      <div className="w-full text-center mt-4 mb-4">
        <p className="text-neon-green font-mono text-sm uppercase tracking-widest">
          ROUND 2 <span className="text-neutral-500 mx-2">|</span> TURN: <span className="text-white font-bold animate-pulse">Rick Sanchez</span>
        </p>
      </div>

      {/* Esteira de Itens (Conveyor Belt) */}
      <div className="relative w-full bg-neutral-900/50 border-2 border-border-muted rounded-lg p-2 md:p-4 min-h-[200px] flex flex-col justify-center gap-4 overflow-hidden">
        {/* Background Grid FX */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />

        {/* Linha 1 */}
        <div className="flex justify-center gap-1 md:gap-4 z-10 min-h-[64px]">
          {row1.map(pill => (
            <Pill
              key={pill.id}
              type={pill.type}
              revealed={pill.revealed}
              onClick={() => handlePillClick(pill.id, pill.type)}
            />
          ))}
          {row1.length === 0 && row2.length === 0 && (
            <div className="text-text-muted font-mono text-xs animate-pulse mt-8">WAITING FOR REFILL...</div>
          )}
        </div>

        {/* Linha 2 */}
        {row2.length > 0 && (
          <div className="flex justify-center gap-1 md:gap-4 z-10 border-t border-white/5 pt-4">
            {row2.map(pill => (
              <Pill
                key={pill.id}
                type={pill.type}
                revealed={pill.revealed}
                onClick={() => handlePillClick(pill.id, pill.type)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status / Legenda (Counts) */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] md:text-xs font-mono text-neutral-400">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pill-safe shadow-[0_0_5px_var(--color-pill-safe)]" /> 7 SAFE</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_5px_var(--color-neon-purple)]" /> 4 POISON</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-yellow shadow-[0_0_5px_var(--color-neon-yellow)]" /> 3 TOXIC</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_5px_var(--color-neon-red)]" /> 0 LETHAL</span>
      </div>
    </div>
  );
}
