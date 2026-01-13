import { useMemo, useState } from 'react';
import { useAppShellStore } from '@/stores/appShellStore';
import { useFlowStore } from '@/stores/flowStore';
import { useNotification } from '@/stores/notificationStore';
import { LobbyScreen } from '@/screens/LobbyScreen';
import { DraftScreen } from '@/screens/DraftScreen';
import { MatchScreen } from '@/screens/MatchScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { DevOverlayPreview } from '@/components/dev/DevOverlayPreview';
import { DevDock } from '@/components/dev/DevDock';
import { DevMenu } from '@/components/dev/DevMenu';

type ScreenComponent = () => JSX.Element;

type DetectedScreen = {
  key: string;
  label: string;
  Component: ScreenComponent;
};

function getScreenLabelFromPath(path: string) {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.tsx$/i, '').replace(/Screen$/i, ' Screen');
}

function pickScreenComponent(moduleExports: Record<string, unknown>): ScreenComponent | null {
  const maybeDefault = moduleExports.default;
  if (typeof maybeDefault === 'function') return maybeDefault as ScreenComponent;

  // Prefer exports that end with "Screen"
  const screenExportKey = Object.keys(moduleExports).find(
    key => /Screen$/.test(key) && typeof moduleExports[key] === 'function',
  );
  if (screenExportKey) return moduleExports[screenExportKey] as ScreenComponent;

  // Fallback: first function export
  const anyFnKey = Object.keys(moduleExports).find(key => typeof moduleExports[key] === 'function');
  if (anyFnKey) return moduleExports[anyFnKey] as ScreenComponent;

  return null;
}

/**
 * DevToolsOverlay é um overlay de DEV (fora das Screens) que permite:
 * - pré-visualizar Screens (incluindo por Phase)
 * - abrir um dock flutuante com ações e playgrounds
 */
export function DevToolsOverlay() {
  const [mode, setMode] = useState<'real' | 'preview'>('real');
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  // Flow Store
  const phase = useFlowStore(state => state.phase);
  const setPhaseGuarded = useFlowStore(state => state.setPhaseGuarded);
  const resetRun = useFlowStore(state => state.resetRun);
  const finishRun = useFlowStore(state => state.finishRun);

  // App Shell Store
  const appScreen = useAppShellStore(state => state.appScreen);
  const setAppScreen = useAppShellStore(state => state.setAppScreen);
  const devOverride = useAppShellStore(state => state.devOverride);
  const setDevOverride = useAppShellStore(state => state.setDevOverride);
  const clearDevOverride = useAppShellStore(state => state.clearDevOverride);

  // Notification Store
  const { show: showNotification, dismiss: dismissNotification, clear: clearNotifications } = useNotification();

  const screens = useMemo<DetectedScreen[]>(() => {
    const modules = import.meta.glob('../../screens/*.tsx', { eager: true }) as Record<
      string,
      Record<string, unknown>
    >;

    return Object.entries(modules)
      .map(([path, mod]) => {
        const Component = pickScreenComponent(mod);
        if (!Component) return null;

        const label = getScreenLabelFromPath(path);
        const key = path;
        return { key, label, Component };
      })
      .filter((x): x is DetectedScreen => Boolean(x))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const selected =
    previewKey && previewKey !== '__phase__' ? (screens.find(s => s.key === previewKey) ?? null) : null;

  const PhaseRouterPreview = useMemo(() => {
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
  }, [phase]);

  const previewNode = previewKey === '__phase__' ? PhaseRouterPreview : selected ? <selected.Component /> : null;

  const previewOptions = useMemo(
    () => screens.map(screen => ({ key: screen.key, label: screen.label })),
    [screens],
  );

  return (
    <>
      <DevOverlayPreview preview={mode === 'preview' ? previewNode : null} />

      <DevDock>
        <DevMenu
          mode={mode}
          setMode={setMode}
          previewKey={previewKey}
          setPreviewKey={setPreviewKey}
          previewOptions={previewOptions}
          phase={phase}
          setPhaseGuarded={setPhaseGuarded}
          resetRun={resetRun}
          finishRun={finishRun}
          appScreen={appScreen}
          setAppScreen={setAppScreen}
          devOverride={devOverride}
          setDevOverride={setDevOverride}
          clearDevOverride={clearDevOverride}
          showNotification={showNotification}
          dismissNotification={dismissNotification}
          clearNotifications={clearNotifications}
          onClosePreview={() => setPreviewKey(null)}
        />
      </DevDock>
    </>
  );
}


