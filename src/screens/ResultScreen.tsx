import React, { useState } from 'react';
import { ResultsHero } from '@/components/results/ResultsHero';
import { ResultsStats } from '@/components/results/ResultsStats';
import { ResultsRewards } from '@/components/results/ResultsRewards';
import { ResultsActions } from '@/components/results/ResultsActions';
import type { ResultsTheme } from '@/components/results/resultsTheme';

// --- TYPES ---
type GameResult = 'VICTORY' | 'DEFEAT';

// --- MAIN COMPONENT ---

export const ResultScreen = () => {
    // Toggle for development/preview purposes
    const [result, setResult] = useState<GameResult>('VICTORY');
    const isVictory = result === 'VICTORY';

    // THEME CONFIGURATION
    const theme: { victory: ResultsTheme; defeat: ResultsTheme; bg: { victory: string; defeat: string } } = {
        victory: {
            accent: "text-green-400",
            border: "border-green-600",
            glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
            titleColor: "text-yellow-400", // Gold
            button: "bg-gradient-to-b from-green-500 to-green-700 border-green-900 text-white",
            spotlight: "bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-200/20 via-transparent to-transparent"
        },
        defeat: {
            accent: "text-red-500",
            border: "border-red-800",
            glow: "shadow-[0_0_20px_rgba(220,38,38,0.4)]",
            titleColor: "text-red-600", // Blood Red
            button: "bg-gradient-to-b from-red-600 to-red-800 border-red-950 text-white",
            spotlight: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent"
        },
        bg: {
            victory: "bg-gradient-to-b from-slate-0 to-green-900/20",
            defeat: "bg-gradient-to-b from-slate-0 to-red-950/20"
        }
    };

    const currentTheme = isVictory ? theme.victory : theme.defeat;
    const bgClassName = isVictory ? theme.bg.victory : theme.bg.defeat;

    return (
        <div className={`min-h-screen w-full overflow-hidden relative ${bgClassName}`}>
            {/* Screen: Content */}
            <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-4 font-pixel">

                {/* DEVELOPMENT TOGGLE (Remove in production) */}
                <button
                    onClick={() => setResult(prev => prev === 'VICTORY' ? 'DEFEAT' : 'VICTORY')}
                    className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded font-pixel border-2 border-slate-600"
                >
                    SWITCH STATE
                </button>

                {/* BACKGROUND FX */}
                <div className={`absolute inset-0 z-0 pointer-events-none ${currentTheme.spotlight}`} />

                {/* MAIN CARD CONTAINER */}
                <div className="relative z-10 w-full max-w-lg md:max-w-4xl flex flex-col items-center gap-6">

                    <ResultsHero isVictory={isVictory} currentTheme={currentTheme} />

                    {/* 4. CONTENT GRID (Stats & Rewards) */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">

                        <ResultsStats isVictory={isVictory} currentTheme={currentTheme} />
                        <ResultsRewards isVictory={isVictory} />

                    </div>

                    {/* 5. FOOTER: ACTION BUTTONS */}
                    <ResultsActions isVictory={isVictory} currentTheme={currentTheme} />

                </div>
            </div>
        </div>
    );
};

