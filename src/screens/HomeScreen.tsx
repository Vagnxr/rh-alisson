import React from 'react';
import { Hand, Users, Settings, Skull } from 'lucide-react';
import { HomeTitle } from '@/components/home/HomeTitle';
import { HomeDecorations } from '@/components/home/HomeDecorations';
import { HomeMenuButton } from '@/components/home/HomeMenuButton';
import { HomeInfoCard } from '@/components/home/HomeInfoCard';
import { useAppShellStore } from '@/stores/appShellStore';
import { useFlowStore } from '@/stores/flowStore';

// --- Main Page Component ---

export const HomeScreen = () => {
  const setAppScreen = useAppShellStore(state => state.setAppScreen);
  const setPhaseGuarded = useFlowStore(state => state.setPhaseGuarded);

  const enterGame = () => {
    // Home é fora das Phases; ao entrar no jogo, garantimos o ponto de entrada em LOBBY.
    setPhaseGuarded('LOBBY');
    setAppScreen('GAME');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center font-pixel selection:bg-green-500 selection:text-black">
      {/* Screen: Content */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-6 flex flex-col min-h-full lg:justify-center">

        {/* Section: Header */}
        <HomeTitle />

        {/* Section: Actions */}
        <div className="relative w-full">
          {/* Decorations (Desktop Only) */}
          <HomeDecorations />

          {/* Menu Buttons Stack */}
          <div className="space-y-4">
            <HomeMenuButton
              title="ENTER THE VOID"
              subtitle="Play"
              icon={<Hand size={32} />}
              color="green"
              onClick={enterGame}
            />
            <HomeMenuButton
              title="MULTIPLAYER"
              subtitle="Lobby"
              icon={<Users size={32} />}
              color="purple"
              onClick={enterGame}
            />
            <HomeMenuButton
              title="THE LAB"
              subtitle="Settings"
              icon={<Settings size={32} />}
              color="blue"
            />
            <HomeMenuButton
              title="EXIT DIMENSION"
              subtitle="Quit"
              icon={<Skull size={32} />}
              color="red"
            />
          </div>
        </div>

        {/* Section: Stats */}
        <div className="mt-8 flex flex-col lg:flex-row gap-4 justify-between w-full">
          {/* Daily Challenge (Morty) */}
          <HomeInfoCard
            title="Daily Challenge"
            value="500 SCHMECKLES"
            imageSrc="/images/avatar/rick_winner_md.png"
          // icon={<CircleDollarSign size={20} />}
          // align="left"
          />

          {/* Player Info (Pickle Rick) */}
          <HomeInfoCard
            title="Pickle Rick"
            value="LEVEL 137"
            imageSrc="/images/avatar/pickle_rick_md.png"
            // icon={<Zap size={20} />}
            align="right"
          />
        </div>

        {/* Spacer for notification bar */}
        <div className="h-16" />

      </div>
    </div>
  );
};

