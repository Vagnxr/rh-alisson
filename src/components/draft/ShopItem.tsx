import React from 'react';
import { cn } from '@/lib/cn';
import { GlowButton } from '@/components/ui/glow-button';
import { DraftShopCategory } from '@/types/draft';

type Item = {
  id: number;
  name: string;
  desc: string;
  category: DraftShopCategory;
  price: number;
  icon: React.ReactNode;
};

type ShopItemProps = {
  item: Item;
  onBuy: (item: Item) => void;
  canAfford: boolean;
  timeLeft: number;
};

export const ShopItem = (props: ShopItemProps) => {
  const { item, onBuy, canAfford, timeLeft } = props;

  return (
    <div
      className={cn(
        'group relative flex w-full flex-col items-center',
        'transition-colors hover:border-neutral-300',
      )}
    >
      {/* Image Placeholder Area */}
      <div className="w-full h-full flex items-center justify-center scale-[0.85] sm:scale-100 md:mb-3">{item.icon}</div>

      {/* <h3 className="mb-1 text-xs tracking-wide text-white sm:text-sm">{item.name}</h3>
      <p className="mb-1 min-h-0 text-center text-[10px] text-neutral-500 sm:min-h-[40px] sm:text-xs">
        {item.desc}
      </p>
      <p className="mb-2 font-mono text-[10px] text-neutral-300 sm:text-xs md:mb-3">
        {item.price} SCHMECKLES
      </p> */}

      <GlowButton
        title={canAfford ? 'Buy' : timeLeft > 0 ? 'Poor' : "Buy"}
        variant="solid"
        size="xs"
        disabled={!canAfford}
        onClick={() => onBuy(item)}
        textAlign="center"
        fullWidth
      />
    </div>
  );
};
