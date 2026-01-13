import type { ReactNode } from "react";
import { InventoryItem } from "./inventory";

export type BasePhasePanelHUDProps = {
    className?: string;
};

export type PhasePanelHUDInventory = {
    items: InventoryItem[];
    maxSlots: number;
    title?: string;
};

export type PlayerHUDStats = {
    name: string;
    avatar: string;
    health: number;
    maxHealth?: number;
    resistance: number;
    maxResistance?: number;
};

export type PhasePanelHUDProps = {
    phase: 'lobby' | 'draft' | 'match' | 'results';
    chatThreadId: string;
    actions: ReactNode;
    player: PlayerHUDStats;
    inventory: PhasePanelHUDInventory;
} & BasePhasePanelHUDProps;
