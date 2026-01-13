import type { ReactNode } from "react";

export type InventoryItem = {
    id: string | number;
    name: string;
    icon?: ReactNode;
};

export interface InventorySlotProps {
    item?: InventoryItem;
    className?: string;
}
