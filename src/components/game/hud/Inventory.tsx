import { cn } from "@/lib/cn";
import { InventorySlot } from "@/components/game/hud/InventorySlot";

import type { PhasePanelHUDInventory } from "@/types/hud";

export function Inventory({
    inventory,
    className = '',
}: {
    inventory: PhasePanelHUDInventory;
    className?: string;
}) {
    const { items, maxSlots } = inventory;

    return (
        <div className={cn('min-h-0', className)}>
            <div className="grid grid-cols-8 md:grid-cols-4 gap-2">
                {[...Array(maxSlots)].map((_, i) => (
                    <InventorySlot key={i} item={items[i]} />
                ))}
            </div>
        </div>
    );
}