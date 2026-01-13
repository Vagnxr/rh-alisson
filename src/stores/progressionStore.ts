
import { create } from 'zustand';

interface ProgressionState {
    xp: number;
    level: number;
    schmeckles: number;
    xpToNextLevel: number;
}

interface ProgressionActions {
    addXP: (amount: number) => { leveledUp: boolean, newLevel: number };
    addSchmeckles: (amount: number) => void;
    reset: () => void;
}

const INITIAL_STATE: ProgressionState = {
    xp: 1250,
    level: 5,
    schmeckles: 420,
    xpToNextLevel: 2500
};

export const useProgressionStore = create<ProgressionState & ProgressionActions>((set, get) => ({
    ...INITIAL_STATE,

    addXP: (amount) => {
        const { xp, level, xpToNextLevel } = get();
        let newXp = xp + amount;
        let newLevel = level;
        let leveledUp = false;

        // Lógica simplificada de level up
        if (newXp >= xpToNextLevel) {
            newXp = newXp - xpToNextLevel;
            newLevel++;
            leveledUp = true;
            // Próximo nível requer mais XP (fator arbitrári 1.2x)
            // Na store real isso viria de uma tabela
            set({ xpToNextLevel: Math.floor(xpToNextLevel * 1.2) });
        }

        set({ xp: newXp, level: newLevel });
        return { leveledUp, newLevel };
    },

    addSchmeckles: (amount) => {
        set(state => ({ schmeckles: state.schmeckles + amount }));
    },

    reset: () => set(INITIAL_STATE)
}));
