import { useEffect } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import { Header } from '@/components/game/hud/Header';
import { ShopItem } from '@/components/draft/ShopItem';
import { ActionDock } from '@/components/ui/action-dock';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDraftStore } from '@/stores/draftStore';
import { PhasePanelHUD } from '@/components/game/hud/PhasePanelHUD';

import {
  Clock,
  Coins,
} from 'lucide-react';
import type { DraftShopItem } from '@/types/draft';
import { DRAFT_SHOP_CATEGORIES } from '@/types/draft';
import { SHOP_ITEMS } from '@/data/shopItems';

import { useAppShellStore } from '@/stores/appShellStore';

export const DraftScreen = () => {
  const setAppScreen = useAppShellStore(state => state.setAppScreen);

  const settings = useDraftStore();
  const {
    pillCoins,
    timeLeft,
    startIn,
    inventory,
    isConfirmed: loadoutConfirmed,
    maxSlots,
    buyItem,
    toggleConfirm: toggleLoadout,
    tickTimer,
    tickStartIn
  } = settings;

  // Helpers de compatibilidade com UI
  const wallet = pillCoins;
  const canBuy = (item: DraftShopItem) => wallet >= item.price && inventory.length < maxSlots && timeLeft > 0;


  // Timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
      tickStartIn();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimer, tickStartIn]);

  // Reset store on mount (optional - maybe handle in flow transition)
  useEffect(() => {
    // reset(); // Se quisermos resetar sempre que entra
  }, []);

  const setPhaseGuarded = useFlowStore(state => state.setPhaseGuarded);

  // Monitora fim do draft (via timer ou confirmação)
  useEffect(() => {
    if (timeLeft === 0 || (loadoutConfirmed && startIn === 0)) {
      setPhaseGuarded('MATCH');
    }
  }, [timeLeft, loadoutConfirmed, startIn, setPhaseGuarded]);

  const formattedDraftTime = `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`;

  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col">
      {/* Section: Header */}
      <Header
        left={{
          icon: <Coins className="text-neon-yellow" size={18} />,
          label: 'PILL COINS',
          value: wallet,
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
          subtitle: 'Shop',
        }}
        right={{
          icon: <Clock className="text-neon-yellow" size={18} />,
          label: 'DRAFT ENDS',
          value: formattedDraftTime,
        }}
      />

      {/* Section: Content (scroll) */}
      <ScrollArea className="flex-1 min-h-0 p-2 font-mono text-xs md:p-0 md:text-sm">
        {/* Section: Shop */}
        <div className="relative flex flex-col justify-center md:my-4">

          {/* Items Container */}
          <div className="py-0 md:pt-4 md:pb-6">
            <div className="grid grid-cols-1 items-center justify-center lg:grid-cols-4">
              {/* Category Columns */}
              {Object.keys(DRAFT_SHOP_CATEGORIES).map(category => (
                <div
                  key={category}
                  className="flex flex-col gap-2 px-0 md:px-3"
                >
                  <h3 className="text-sm text-white uppercase">{category}</h3>
                  <div className="grid grid-cols-5 space-y-4 gap-2 md:gap-3 lg:grid-cols-3">
                    {/* Category Items */}
                    {[...Array(5)].map((_, itemIndex) => (
                      <div key={itemIndex} className="col-span-1 w-full">
                        <ShopItem
                          item={SHOP_ITEMS[itemIndex]}
                          onBuy={buyItem}
                          canAfford={canBuy(SHOP_ITEMS[itemIndex])}
                          timeLeft={timeLeft}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ScrollArea>

      {/* Section: Footer (Inventory + Chat + Actions) */}
      <PhasePanelHUD
        phase="draft"
        chatThreadId="draft"
        player={{
          name: 'Rick Sanchez',
          avatar: '/images/avatar/rick_winner.png',
          health: 2,
          maxHealth: 3,
          resistance: 3,
          maxResistance: 6,
        }}
        inventory={{
          items: inventory,
          maxSlots,
          title: `Backpack (${inventory.length}/${maxSlots} Slots)`,
        }}
        actions={
          <ActionDock
            leave={{
              disabled: false,
              onClick: () => setAppScreen('HOME')
            }}
            loadout={{
              onPress: toggleLoadout,
              disabled: timeLeft === 0,
              pressed: loadoutConfirmed,
              timeLeft: timeLeft,
              startIn: startIn,
            }}
          />
        }
      />

    </div>
  );
};
