import type React from 'react';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
}

export type DraftShopCategory = 'INTEL' | 'SUSTAIN' | 'CONTROL' | 'CHAOS';
export const DRAFT_SHOP_CATEGORIES: Record<DraftShopCategory, string> = {
  INTEL: 'Intel',
  SUSTAIN: 'Sustain',
  CONTROL: 'Control',
  CHAOS: 'Chaos',
};

export interface DraftShopItem {
  id: number;
  name: string;
  desc: string;
  category: DraftShopCategory;
  price: number;
  icon: React.ReactNode;
}
