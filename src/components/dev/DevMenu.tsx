import { cn } from '@/lib/cn';
import type { Phase } from '@/core/state-machines/phase';
import type { NotificationVariant } from '@/stores/notificationStore';
import type { AppScreen, DevOverride } from '@/stores/appShellStore';
import { NotificationPlayground } from './NotificationPlayground';
import { DevGameState } from './DevGameState';

function getPreviousPhase(phase: Phase): Phase {
  if (phase === 'DRAFT') return 'LOBBY';
  if (phase === 'MATCH') return 'DRAFT';
  if (phase === 'RESULTS') return 'MATCH';
  return 'LOBBY';
}

function getNextPhase(phase: Phase): Phase {
  if (phase === 'LOBBY') return 'DRAFT';
  if (phase === 'DRAFT') return 'MATCH';
  if (phase === 'MATCH') return 'RESULTS';
  return 'LOBBY';
}

function isInGame(screen: AppScreen): boolean {
  return screen === 'GAME';
}

export interface DevMenuProps {
  mode: 'real' | 'preview';
  setMode: (value: 'real' | 'preview') => void;

  // Preview (overlay)
  previewKey: string | null;
  setPreviewKey: (value: string | null) => void;
  previewOptions: { key: string; label: string }[];

  phase: Phase;
  setPhaseGuarded: (phase: Phase) => void;
  resetRun: () => void;
  finishRun: () => void;

  appScreen: AppScreen;
  setAppScreen: (next: AppScreen) => void;

  devOverride: DevOverride | null;
  setDevOverride: (override: DevOverride) => void;
  clearDevOverride: () => void;

  showNotification: (args: { message: string; variant: NotificationVariant; durationTime: number }) => void;
  dismissNotification: () => void;
  clearNotifications: () => void;

  onClosePreview: () => void;
}

export function DevMenu({
  mode,
  setMode,
  previewKey,
  setPreviewKey,
  previewOptions,
  phase,
  setPhaseGuarded,
  resetRun,
  finishRun,
  appScreen,
  setAppScreen,
  devOverride,
  setDevOverride,
  clearDevOverride,
  showNotification,
  dismissNotification,
  clearNotifications,
  onClosePreview,
}: DevMenuProps) {
  const inGameScreen = isInGame(appScreen);
  const inHomeScreen = !isInGame(appScreen);

  return (
    <div className="flex min-h-0 flex-col p-2">
      <div className="flex flex-col gap-3">
        <div className="rounded border border-neutral-800 bg-black/50 p-3">
          <div className="mb-2 text-xs tracking-widest text-neutral-400 uppercase">Modo</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('real')}
              className={cn(
                'rounded border border-neutral-700 px-3 py-2 text-xs tracking-wider uppercase',
                mode === 'real' ? 'bg-neutral-900 text-white' : 'bg-black text-neutral-300 hover:bg-neutral-900/60',
              )}
            >
              Estado real
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={cn(
                'rounded border border-neutral-700 px-3 py-2 text-xs tracking-wider uppercase',
                mode === 'preview' ? 'bg-neutral-900 text-white' : 'bg-black text-neutral-300 hover:bg-neutral-900/60',
              )}
            >
              Preview overlay
            </button>
          </div>
        </div>

        {mode === 'preview' ? (
          <label className="flex flex-col gap-2">
            <span className="text-xs tracking-wider text-neutral-400 uppercase">Tela (preview)</span>
            <select
              value={previewKey ?? ''}
              onChange={e => setPreviewKey(e.target.value ? e.target.value : null)}
              className={cn(
                'w-full',
                'rounded border-2 border-neutral-700 bg-black',
                'px-3 py-2 text-sm text-white',
                'focus:ring-2 focus:ring-neutral-600 focus:outline-none',
              )}
            >
              <option value="">(sem preview)</option>
              <option value="__phase__">(seguir phase)</option>
              {previewOptions.map(screen => (
                <option key={screen.key} value={screen.key}>
                  {screen.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="rounded border border-neutral-800 bg-black/50 p-3">
            <div className="mb-2 text-xs tracking-widest text-neutral-400 uppercase">APP STATE</div>
            <div className="grid grid-cols-4 items-start justify-between gap-2">
              <div className="col-span-1 text-xs text-white">
                Atual: <span className="font-normal">{appScreen}</span>
              </div>
              <div className="col-span-3 grid grid-cols-3 gap-2">
                <button
                  disabled={inHomeScreen}
                  type="button"
                  onClick={() => setAppScreen('HOME')}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
                    'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Home
                </button>
                <button
                  disabled={inGameScreen}
                  type="button"
                  onClick={() => {
                    setAppScreen('GAME');
                    setPhaseGuarded('LOBBY');
                  }}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
                    'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Game
                </button>

                <button
                  disabled={inHomeScreen}
                  type="button"
                  onClick={() => {
                    setAppScreen('HOME');
                    setPhaseGuarded('LOBBY');
                  }}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
                    'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Lobby
                </button>
                <button
                  type="button"
                  disabled={inHomeScreen}
                  onClick={() => {
                    if (phase === 'LOBBY') finishRun();
                    else setPhaseGuarded(getPreviousPhase(phase));
                  }}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
                    'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={inHomeScreen}
                  onClick={resetRun}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
                    'text-xs text-morty-yellow hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Reset
                </button>
                <button
                  type="button"
                  disabled={inHomeScreen}
                  onClick={() => {
                    if (phase === 'RESULTS') resetRun();
                    else setPhaseGuarded(getNextPhase(phase));
                  }}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
                    'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Next
                </button>
              </div>
            </div>


            <div className="flex items-center justify-between mt-2 text-xs text-neutral-300">
              Phase atual: <span
                className={cn(
                  'tracking-wider uppercase',
                  inHomeScreen ? 'text-neutral-400' : 'text-morty-yellow'
                )}
              >{inGameScreen ? phase : '(sem phase)'}</span>
            </div>

            <div className="mt-3 border-t border-neutral-800 pt-3">
              <div className="mb-2 text-xs tracking-widest text-neutral-400">
                OVERRIDE <span className="text-neutral-500"> - (ScreenRouter only)</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-300">Ativar</span>
                  <input
                    type="checkbox"
                    checked={Boolean(devOverride)}
                    onChange={e => (e.target.checked ? setDevOverride({}) : clearDevOverride())}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-300">AppScreen</span>
                  <select
                    value={(devOverride?.appScreen ?? '') as string}
                    disabled={!devOverride}
                    onChange={e =>
                      setDevOverride({
                        ...(devOverride ?? {}),
                        appScreen: (e.target.value || undefined) as AppScreen | undefined,
                      })
                    }
                    className={cn(
                      'w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-white',
                      'disabled:opacity-60',
                    )}
                  >
                    <option value="">(selecione um appScreen)</option>
                    <option value="HOME">HOME</option>
                    <option value="GAME">GAME</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-300">PhaseScreen</span>
                  <select
                    value={(devOverride?.phase ?? '') as string}
                    disabled={!devOverride || devOverride?.appScreen === 'HOME'}
                    onChange={e =>
                      setDevOverride({
                        ...(devOverride ?? {}),
                        phase: (e.target.value || undefined) as Phase | undefined,
                      })
                    }
                    className={cn(
                      'w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-white',
                      'disabled:opacity-60',
                    )}
                  >
                    <option value="">(selecione uma phase)</option>
                    <option value="LOBBY">LOBBY</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="MATCH">MATCH</option>
                    <option value="RESULTS">RESULTS</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={clearDevOverride}
                  disabled={!devOverride}
                  className={cn(
                    'rounded border border-neutral-700 bg-neutral-900 px-3 py-2',
                    'text-xs tracking-wider text-white uppercase',
                    'hover:border-neutral-300 hover:bg-neutral-800',
                    'disabled:opacity-60 disabled:hover:border-neutral-700 disabled:hover:bg-neutral-900',
                  )}
                >
                  Limpar override
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'real' && inGameScreen && (
          <DevGameState />
        )}


        <NotificationPlayground
          showNotification={showNotification}
          dismissNotification={dismissNotification}
          clearNotifications={clearNotifications}
        />

        <button
          type="button"
          onClick={onClosePreview}
          className={cn(
            'font-pixel',
            'rounded border-2 border-neutral-700 bg-neutral-900',
            'px-3 py-2 text-xs tracking-wider text-white uppercase',
            'hover:border-neutral-300 hover:bg-neutral-800',
          )}
        >
          Fechar preview
        </button>
      </div>
    </div>
  );
}
