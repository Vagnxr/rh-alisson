
import { create } from 'zustand';
import type { DraftShopItem } from '@/types/draft';
import { postSystemMessage } from '@/lib/systemMessages';

interface DraftState {
    pillCoins: number;
    inventory: DraftShopItem[];
    timeLeft: number;
    startIn: number; // Countdown após confirmação
    isConfirmed: boolean;
    maxSlots: number;
}

interface DraftActions {
    initDraft: (coins?: number, time?: number) => void;
    buyItem: (item: DraftShopItem) => boolean;
    sellItem: (index: number) => void;
    toggleConfirm: () => void;
    tickTimer: () => void;
    tickStartIn: () => void;
    setCoins: (amount: number) => void;
    setTimer: (seconds: number) => void;
    reset: () => void;
}

const INITIAL_STATE: DraftState = {
    pillCoins: 150,
    inventory: [],
    timeLeft: 30,
    startIn: 5,
    isConfirmed: false,
    maxSlots: 8
};

export const useDraftStore = create<DraftState & DraftActions>((set, get) => ({
    ...INITIAL_STATE,

    initDraft: (coins = 150, time = 30) => {
        set({ ...INITIAL_STATE, pillCoins: coins, timeLeft: time });
    },

    setTimer: (seconds: number) => {
        set({ timeLeft: seconds });
    },

    buyItem: (item) => {
        const { pillCoins, inventory, maxSlots, timeLeft } = get();

        if (timeLeft <= 0) return false;
        if (inventory.length >= maxSlots) {
            postSystemMessage('draft', 'Inventário cheio!');
            return false;
        }
        if (pillCoins < item.price) {
            postSystemMessage('draft', 'Saldo insuficiente!');
            return false;
        }

        set(state => ({
            pillCoins: state.pillCoins - item.price,
            inventory: [...state.inventory, item]
        }));
        postSystemMessage('draft', `Comprou ${item.name} (-${item.price})`);
        return true;
    },

    sellItem: (index) => {
        // Venda retorna 50% do valor (regra de gameplay)
        const item = get().inventory[index];
        if (!item) return;

        const refund = Math.floor(item.price * 0.5);

        set(state => ({
            inventory: state.inventory.filter((_, i) => i !== index),
            pillCoins: state.pillCoins + refund
        }));
        postSystemMessage('draft', `Vendeu ${item.name} (+${refund})`);
    },

    toggleConfirm: () => {
        const { isConfirmed } = get();
        if (isConfirmed) {
            // Cancelar
            set({ isConfirmed: false, startIn: 5 });
            postSystemMessage('draft', '> Loadout cancelado.');
        } else {
            // Confirmar
            set({ isConfirmed: true });
            postSystemMessage('draft', '> Loadout confirmado. Iniciando...');
        }
    },

    tickTimer: () => {
        const { timeLeft, isConfirmed } = get();
        if (timeLeft > 0 && !isConfirmed) {
            set({ timeLeft: timeLeft - 1 });
        }
    },

    tickStartIn: () => {
        const { startIn, isConfirmed } = get();
        if (isConfirmed && startIn > 0) {
            set({ startIn: startIn - 1 });
        }
    },

    setCoins: (amount) => set({ pillCoins: amount }),

    reset: () => set(INITIAL_STATE)
}));
