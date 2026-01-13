import { Trophy, ThumbsUp } from 'lucide-react';
import type { ResultsTheme } from './resultsTheme';

export interface ResultsHeroProps {
  isVictory: boolean;
  currentTheme: ResultsTheme;
}

export function ResultsHero({ isVictory, currentTheme }: ResultsHeroProps) {
  return (
    <>
      {/* 1. TOP STATUS BADGE */}
      <div
        className={`
          px-8 py-2 rounded-full border-4 bg-slate-900/90 backdrop-blur-md
          ${currentTheme.border} ${currentTheme.glow}
        `}
      >
        <h2
          className={`text-xl md:text-2xl tracking-[0.2em] uppercase ${
            isVictory ? 'text-white' : 'text-red-500'
          }`}
        >
          {isVictory ? 'VICTORY' : 'DEAD'}
        </h2>
      </div>

      {/* 2. MAIN TITLE (SURVIVED / DIED) */}
      <div className="text-center relative">
        <h1
          className={`
            text-6xl md:text-8xl font-black uppercase tracking-widest
            drop-shadow-[4px_4px_0_rgba(0,0,0,1)]
            ${currentTheme.titleColor}
          `}
          style={{ WebkitTextStroke: '2px black' }}
        >
          {isVictory ? 'SURVIVED' : 'DIED'}
        </h1>
      </div>

      {/* 3. AVATAR AREA */}
      <div className="relative group">
        {/* Laurel Wreath or Halo */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-full flex justify-center z-20">
          {isVictory ? (
            <Trophy
              size={48}
              className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
            />
          ) : (
            <div className="w-24 h-6 border-4 border-yellow-400/50 rounded-[50%] shadow-[0_0_15px_yellow]" />
          )}
        </div>

        {/* Avatar Image */}
        <div
          className={`
            w-40 h-40 md:w-48 md:h-48 rounded-full border-4 bg-slate-800 overflow-hidden relative
            ${currentTheme.border} shadow-[0_0_30px_rgba(0,0,0,0.5)]
          `}
        >
          <img
            src={isVictory ? '/images/avatar/rick_winner.png' : '/images/avatar/rick_looser.png'}
            alt={isVictory ? 'Rick Winner' : 'Rick Looser'}
            className="w-full h-full object-cover png-outline"
            draggable={false}
          />
        </div>

        {/* Thumbs up decoration */}
        {isVictory ? (
          <div className="absolute -bottom-2 -right-4 rotate-12 drop-shadow-lg">
            <ThumbsUp size={40} className="text-yellow-400" />
          </div>
        ) : null}
      </div>
    </>
  );
}
