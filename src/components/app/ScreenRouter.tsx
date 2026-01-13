import { useMemo } from 'react';
import { HomeScreen } from '@/screens/HomeScreen';
import { LobbyScreen } from '@/screens/LobbyScreen';
import { DraftScreen } from '@/screens/DraftScreen';
import { MatchScreen } from '@/screens/MatchScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { useFlowStore } from '@/stores/flowStore';
import { useAppShellStore, type AppScreen } from '@/stores/appShellStore';
import type { Phase } from '@/core/state-machines/phase';

function resolveAppScreenWithDevOverride(
  appScreen: AppScreen,
  phase: Phase,
  devOverride: { appScreen?: AppScreen; phase?: Phase } | null,
) {
  if (!import.meta.env.DEV) return { appScreen, phase };
  if (!devOverride) return { appScreen, phase };

  return {
    appScreen: devOverride.appScreen ?? appScreen,
    phase: devOverride.phase ?? phase,
  };
}

function renderGameByPhase(phase: Phase) {
  switch (phase) {
    case 'LOBBY':
      return <LobbyScreen />;
    case 'DRAFT':
      return <DraftScreen />;
    case 'MATCH':
      return <MatchScreen />;
    case 'RESULTS':
      return <ResultScreen />;
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

/**
 * Router simples (sem libs externas) para renderizar a Screen real do app.
 *
 * - `HOME` renderiza `HomeScreen` (fora das Phases).
 * - `GAME` renderiza a Screen derivada da Phase (`flowStore.phase`).
 * - Em DEV, um `devOverride` pode forçar `appScreen` e/ou `phase` para debug.
 */
export function ScreenRouter() {
  const appScreen = useAppShellStore(state => state.appScreen);
  const devOverride = useAppShellStore(state => state.devOverride);
  const phase = useFlowStore(state => state.phase);

  const effective = useMemo(
    () => resolveAppScreenWithDevOverride(appScreen, phase, devOverride),
    [appScreen, phase, devOverride],
  );

  if (effective.appScreen === 'HOME') return <HomeScreen />;
  return renderGameByPhase(effective.phase);
}


