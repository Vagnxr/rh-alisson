import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { useFlowStore } from '@/stores/flowStore';
import { useAppShellStore } from '@/stores/appShellStore';
import { useDraftStore } from '@/stores/draftStore';
import type { ResultsTheme } from './resultsTheme';

export interface ResultsActionsProps {
  isVictory: boolean;
  currentTheme: ResultsTheme;
}

export function ResultsActions({ isVictory, currentTheme }: ResultsActionsProps) {
  const resetRun = useFlowStore(state => state.resetRun);
  const setAppScreen = useAppShellStore(state => state.setAppScreen);
  const resetDraft = useDraftStore(state => state.reset);

  const handlePlayAgain = () => {
    resetDraft();
    resetRun();
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-2">
      <div className="flex gap-4 w-full md:w-auto">
        <button
          type="button"
          onClick={handlePlayAgain}
          className={
            `
            flex-1 md:w-64 py-4 rounded-xl border-b-8 font-pixel text-xl uppercase tracking-wider
            shadow-lg active:border-b-0 active:translate-y-2 transition-all
            ${currentTheme.button}
          `
          }
        >
          <div className="flex items-center justify-center gap-2">
            <RefreshCw size={24} strokeWidth={3} />
            {isVictory ? 'Play Again' : 'Try Again'}
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setAppScreen('HOME')}
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-pixel text-sm uppercase"
      >
        <Home size={14} /> Return to Main Menu
      </button>

      <div className="flex items-center gap-1 text-red-900/50 hover:text-red-500 cursor-pointer transition-colors text-xs uppercase mt-4">
        <AlertTriangle size={12} /> Report Player
      </div>
    </div>
  );
}
