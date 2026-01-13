import { create } from 'zustand';
import { canTransition, type Phase } from '@/core/state-machines/phase';

interface FlowStore {
  phase: Phase;
  runId: number;

  setPhaseGuarded: (next: Phase) => boolean;
  resetRun: () => void;
  finishRun: () => void;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  phase: 'LOBBY',
  runId: 0,

  setPhaseGuarded: next => {
    const current = get().phase;
    if (!canTransition(current, next)) return false;
    set({ phase: next });
    return true;
  },

  resetRun: () => {
    set(state => ({ phase: 'LOBBY', runId: state.runId + 1 }));
  },

  finishRun: () => {
    set(state => ({ phase: 'RESULTS', runId: state.runId + 1 }));
  },
}));

export const flowActions = {
  getPhase(): Phase {
    return useFlowStore.getState().phase;
  },
  setPhaseGuarded(next: Phase): boolean {
    return useFlowStore.getState().setPhaseGuarded(next);
  },
  resetRun() {
    useFlowStore.getState().resetRun();
  },
  finishRun() {
    useFlowStore.getState().finishRun();
  },
};
