import { create } from 'zustand';
import type { Phase } from '@/core/state-machines/phase';

export type AppScreen = 'HOME' | 'GAME';

export interface DevOverride {
  appScreen?: AppScreen;
  phase?: Phase;
}

interface AppShellStore {
  /** Estado real do App (fora do escopo das Phases do jogo) */
  appScreen: AppScreen;

  /** Override apenas para DEV (não deve ser usado como fonte de verdade do app) */
  devOverride: DevOverride | null;

  setAppScreen: (next: AppScreen) => void;
  setDevOverride: (override: DevOverride) => void;
  clearDevOverride: () => void;
}

export const useAppShellStore = create<AppShellStore>(set => ({
  appScreen: 'HOME',
  devOverride: null,

  setAppScreen: next => set({ appScreen: next }),

  setDevOverride: override => set({ devOverride: override }),

  clearDevOverride: () => set({ devOverride: null }),
}));

export const appShellActions = {
  getAppScreen(): AppScreen {
    return useAppShellStore.getState().appScreen;
  },
  setAppScreen(next: AppScreen) {
    useAppShellStore.getState().setAppScreen(next);
  },
  setDevOverride(override: DevOverride) {
    useAppShellStore.getState().setDevOverride(override);
  },
  clearDevOverride() {
    useAppShellStore.getState().clearDevOverride();
  },
};


