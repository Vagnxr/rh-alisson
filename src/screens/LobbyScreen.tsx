import { useFlowStore } from '@/stores/flowStore';
import { LobbyPanel } from '@/components/lobby/LobbyPanel';
import { PlayerGrid } from '@/components/lobby/PlayerGrid';
import { ActionDock } from '@/components/ui/action-dock';
import { Header } from '@/components/game/hud/Header';
import { PhasePanelHUD } from '@/components/game/hud/PhasePanelHUD';
import { Activity, KeyRound } from 'lucide-react';
import { useLobbyMock } from '@/hooks/useLobbyMock';

import { useAppShellStore } from '@/stores/appShellStore';

// --- Main Screen ---

export const LobbyScreen = () => {
  const { players, currentUserReady, toggleReady } = useLobbyMock();
  const roomCode = 'X7Z-123';
  const lobbyStatus = 'AGUARDANDO...';

  const setPhaseGuarded = useFlowStore(state => state.setPhaseGuarded);
  const setAppScreen = useAppShellStore(state => state.setAppScreen);

  const handleReady = () => {
    toggleReady();
    // Simulação Solo: Start imediato após ready (se virar true)
    if (!currentUserReady) {
      setTimeout(() => {
        setPhaseGuarded('DRAFT');
      }, 1000);
    }
  };

  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col">
      {/* Section: Header */}
      <Header
        left={{
          icon: <KeyRound className="text-neon-yellow" size={18} />,
          label: 'ROOM',
          value: roomCode,
        }}
        right={{
          icon: <Activity className="text-neon-yellow" size={18} />,
          label: 'STATUS',
          value: lobbyStatus,
        }}
        center={{
          title: 'Game',
          artwork: (
            <img
              src="/images/avatar/rick_winner_md.png"
              alt="Rick Winner"
              className="-my-4 size-16 drop-shadow-xs select-none"
              draggable={false}
            />
          ),
          subtitle: 'Lobby',
        }}
      />

      {/* Section: Main */}
      <main className="flex-1 min-h-0">
        <LobbyPanel className="h-full">
          <PlayerGrid players={players} />
        </LobbyPanel>
      </main>

      {/* Section: Footer */}
      <PhasePanelHUD
        phase="lobby"
        chatThreadId="lobby"
        player={{
          name: 'RICK_C_137',
          avatar: '/images/avatar/rick_sanchez.png',
          health: 3,
          maxHealth: 3,
          resistance: 6,
          maxResistance: 6,
        }}
        inventory={{
          items: [],
          maxSlots: 8,
        }}
        actions={
          <ActionDock
            ready={{
              onPress: handleReady,
              pressed: currentUserReady,
              disabled: false,
            }}
            leave={{
              disabled: false,
              onClick: () => setAppScreen('HOME')
            }}
          />
        }
      />

    </div>
  );
};
