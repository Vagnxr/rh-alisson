import type { ReactNode } from 'react';
import { Pill, Package, Hourglass, Skull } from 'lucide-react';
import type { ResultsTheme } from './resultsTheme';

interface StatRowProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

function StatRow({ label, value, icon, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded bg-black/40 ${color}`}>{icon}</div>
        <span className="text-slate-300 font-pixel text-lg uppercase tracking-wide">{label}:</span>
      </div>
      <span className={`font-pixel text-2xl ${color} drop-shadow-md`}>{value}</span>
    </div>
  );
}

export interface ResultsStatsProps {
  isVictory: boolean;
  currentTheme: ResultsTheme;
}

export function ResultsStats({ isVictory, currentTheme }: ResultsStatsProps) {
  return (
    <div
      className={`
        bg-slate-900/80 border-4 rounded-xl p-4 flex flex-col shadow-lg
        ${currentTheme.border}
      `}
    >
      <h3
        className={`text-center text-xl uppercase mb-4 border-b-2 border-slate-700 pb-2 ${
          currentTheme.accent
        }`}
      >
        Match Stats
      </h3>

      <div className="space-y-1 flex-1">
        <StatRow
          label={isVictory ? 'Pills Survived' : 'Pills Taken'}
          value="12"
          icon={<Pill size={16} />}
          color={isVictory ? 'text-cyan-400' : 'text-blue-400'}
        />
        <StatRow
          label={isVictory ? 'Items Used' : 'Items Wasted'}
          value="5"
          icon={<Package size={16} />}
          color={isVictory ? 'text-yellow-400' : 'text-orange-400'}
        />
        <StatRow
          label={isVictory ? 'Turns Survived' : 'Turns Lasted'}
          value="8"
          icon={<Hourglass size={16} />}
          color={isVictory ? 'text-purple-400' : 'text-slate-400'}
        />
      </div>

      {/* Skull icons at bottom of stats */}
      <div className="flex justify-center gap-2 mt-4 opacity-50">
        <Skull size={20} className={isVictory ? 'text-slate-600' : 'text-red-800'} />
        <Skull size={20} className={isVictory ? 'text-slate-600' : 'text-red-800'} />
        <Skull size={20} className={isVictory ? 'text-slate-600' : 'text-red-800'} />
      </div>
    </div>
  );
}
