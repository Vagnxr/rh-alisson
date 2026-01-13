import { OpponentsBar } from '@/components/match/hud/OpponentsBar';
import { GameTable } from '@/components/match/table/GameTable';
import { PhasePanelHUD } from '@/components/game/hud/PhasePanelHUD';
import { ActionDock } from '@/components/ui/action-dock';
import { Header } from '@/components/game/hud/Header';
import { Coins, Trophy } from 'lucide-react';

import { useFlowStore } from '@/stores/flowStore';
import { useGameStore } from '@/stores/gameStore';
import { useEffect } from 'react';


export const MatchScreen = () => {
  const setPhaseGuarded = useFlowStore(state => state.setPhaseGuarded);
  const initMatch = useGameStore(state => state.initMatch);
  const tablePills = useGameStore(state => state.tablePills);

  useEffect(() => {
    if (tablePills.length === 0) {
      initMatch();
    }
  }, [initMatch, tablePills.length]);

  const localPlayer = useGameStore(state => state.players.find(p => p.id === 'player-1'));

  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col">
      {/* Section: Header */}
      <Header
        left={{
          icon: <Coins className="text-neon-yellow" size={18} />,
          label: 'PILL COINS',
          value: 1000,
        }}
        right={{
          icon: <Trophy className="text-neon-yellow" size={18} />,
          label: 'SCORE',
          placeholder: '--',
        }}
        center={{
          title: 'Game',
          artwork: (
            <img
              src="/images/avatar/rick_looser_md.png"
              alt="Rick Winner"
              className="-my-4 size-16 drop-shadow-xs select-none"
              draggable={false}
            />
          ),
          subtitle: 'Round',
        }}
      />

      {/* Section: Opponents */}
      <OpponentsBar />

      {/* Section: Content (scroll) */}
      {/* Section: Table */}
      <div className="flex-1 flex items-center justify-center w-full font-mono text-xs md:p-0 md:text-sm">
        <GameTable />
      </div>

      {/* Section: Footer */}
      <PhasePanelHUD
        phase="match"
        player={{
          name: localPlayer?.name ?? 'Rick Sanchez',
          avatar: localPlayer?.avatarUrl ?? '/images/avatar/rick_sanchez.png',
          health: localPlayer?.hp ?? 3,
          maxHealth: localPlayer?.maxHp ?? 5,
          resistance: localPlayer?.shields ?? 0,
          maxResistance: 6,
        }}
        inventory={{ items: [], maxSlots: 8 }}
        chatThreadId="match"
        actions={
          <ActionDock
            shop={{ disabled: false, onClick: () => { } }}
            leave={{ disabled: false, onClick: () => setPhaseGuarded('RESULTS') }}
          />
        }
      />
    </div>
  );
};

