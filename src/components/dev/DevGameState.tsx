
import { useDraftStore } from '@/stores/draftStore';
import { useGameStore } from '@/stores/gameStore';
import { useProgressionStore } from '@/stores/progressionStore';

export function DevGameState() {
    // Draft
    const { addCoins, addTimer } = useDraftStore(s => ({
        addCoins: (amount: number) => s.setCoins(s.pillCoins + amount),
        addTimer: (seconds: number) => s.setTimer(s.timeLeft + seconds),
    }));

    // Match
    const { initMatch, reset: resetMatch, tablePills } = useGameStore(s => ({
        initMatch: s.initMatch,
        reset: s.reset,
        tablePills: s.tablePills
    }));

    // Progression
    const { addXP, level } = useProgressionStore(s => ({
        addXP: s.addXP,
        level: s.level,
        xp: s.xp
    }));

    const forceLevelUp = () => addXP(5000);

    return (
        <div className="rounded border border-neutral-800 bg-black/50 p-3 mt-3" >
            <div className="mb-2 text-xs tracking-widest text-neon-blue uppercase">Game State Controls</div>

            {/* Draft Controls */}
            <div className="mb-3" >
                <div className="text-[10px] text-neutral-400 mb-1 uppercase">Draft Phase</div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => addCoins(100)}
                        className="bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 text-white hover:bg-neutral-800"
                    >
                        +100 Coins
                    </button>
                    <button
                        onClick={() => addTimer(5)}
                        className="bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 text-white hover:bg-neutral-800"
                    >
                        Add +5s Timer
                    </button>
                </div>
            </div >

            {/* Match Controls */}
            < div className="mb-3" >
                <div className="text-[10px] text-neutral-400 mb-1 uppercase">Match Phase</div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => initMatch()}
                        className="bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 text-white hover:bg-neutral-800"
                    >
                        Force Init Match
                    </button>
                    <button
                        onClick={() => resetMatch()}
                        className="bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 text-red-400 hover:bg-neutral-800"
                    >
                        Reset Match
                    </button>
                    <div className="col-span-2 text-[10px] text-neutral-500">
                        Pills on Table: {tablePills.length}
                    </div>
                </div>
            </div >

            {/* Progression Controls */}
            < div >
                <div className="text-[10px] text-neutral-400 mb-1 uppercase">Progression (Lvl {level})</div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => addXP(50)}
                        className="bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 text-white hover:bg-neutral-800"
                    >
                        +50 XP
                    </button>
                    <button
                        onClick={forceLevelUp}
                        className="bg-neutral-900 border border-neutral-700 text-xs px-2 py-1 text-neon-yellow hover:bg-neutral-800"
                    >
                        Force Level Up
                    </button>
                </div>
            </div >

        </div >
    );
}
