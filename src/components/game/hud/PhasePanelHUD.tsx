import { cn } from '@/lib/cn';
import { PanelShell } from '@/components/game/hud/PanelShell';

import type { PhasePanelHUDProps } from '@/types/hud';
import PlayerInfo from './PlayerInfo';
import { Chat } from '@/components/chat/Chat';



export function PhasePanelHUD(props: PhasePanelHUDProps) {
    const { player, inventory, actions, chatThreadId, className } = props;

    return (
        <PanelShell className={cn('w-full', className)}>
            <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                {/* Lado Esquerdo - Info do Jogador */}
                <PlayerInfo
                    size="md"
                    characterName={player.name}
                    avatarSrc={player.avatar}
                    currentHealth={player.health}
                    maxHealth={player.maxHealth ?? 3}
                    currentResistance={player.resistance}
                    maxResistance={player.maxResistance ?? 6}
                    inventoryItems={inventory.items.map(item => ({
                        id: item.id,
                        name: item.name,
                        icon: item.icon,
                    }))}

                    totalInventorySlots={inventory.maxSlots}
                    className="flex flex-col md:col-span-5"
                />

                {/* Lado Direito - Ações e Chat */}
                <div className="flex flex-col-reverse md:flex-col gap-2 md:col-start-7 md:col-span-6 px-2">
                    <div className={cn('flex min-h-0 flex-col')}>
                        <div className="flex h-full min-h-0 flex-col">{actions}</div>
                    </div>
                    <Chat
                        mode="inline"
                        threadId={chatThreadId}
                        textClass="text-[10px] md:text-xs"
                        displayTime={false}
                        displayAuthor={false}
                        className="h-auto md:h-40"
                    />
                </div>
            </div>
        </PanelShell>
    );
}



