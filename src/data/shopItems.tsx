
import {
    Beer,
    Lock,
    Shuffle,
    Trash,
    Bomb,
} from 'lucide-react';
import type { DraftShopItem } from '@/types/draft';
import { PillScannerIcon } from '@/components/ui/icons/pill-scanner-icon';
import { PillIcon } from '@/components/ui/icons/pill-icon';
import { PortalGunIcon } from '@/components/ui/icons/portal-gun-icon';

export const SHOP_ITEMS: DraftShopItem[] = [
    {
        id: 1,
        name: 'POCKET PILL',
        desc: '- +4 resistance',
        category: 'SUSTAIN',
        price: 50,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            scale={3}
            pill={() => <Beer size={48} strokeWidth={1.5} />}
        />,
    },
    {
        id: 2,
        name: 'SHIELD',
        desc: '- Immunity to damage for 1 round',
        category: 'CONTROL',
        price: 75,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            scale={3}
            pill={() => <Lock size={48} strokeWidth={1.5} />}
        />,
    },
    {
        id: 3,
        name: 'SHAPE SCANNER',
        desc: '- Reveals all pills of shape',
        category: 'INTEL',
        price: 40,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            pill={() => <PillIcon primaryColor='var(--color-neon-red)' />}
        />,
    },
    {
        id: 4,
        name: 'INVERTER',
        desc: '- Inverts pill effect',
        category: 'CHAOS',
        price: 100,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            pill={() => <PortalGunIcon glowColor='var(--color-neon-green)' />}
        />,
    },
    {
        id: 5,
        name: 'DOUBLE',
        desc: '- Doubles pill effect',
        category: 'CHAOS',
        price: 60,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            pill={() => <PortalGunIcon glowColor='var(--color-neon-green)' />}
        />,
    },
    {
        id: 6,
        name: 'SHUFFLE',
        desc: '- Shuffles pill pool',
        category: 'CHAOS',
        price: 80,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            scale={3}
            pill={() => <Shuffle size={48} strokeWidth={1.5} />}
        />,
    },
    {
        id: 7,
        name: 'DISCARD',
        desc: '- Removes pill from pool',
        category: 'CHAOS',
        price: 90,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            scale={3}
            pill={() => <Trash size={48} strokeWidth={1.5} />}
        />,
    },
    {
        id: 8,
        name: 'SHAPE BOMB',
        desc: '- Removes all pills of shape',
        category: 'CHAOS',
        price: 100,
        icon: <PillScannerIcon
            pillColor='var(--color-neon-green)'
            size={70}
            scale={3}
            pill={() => <Bomb size={48} strokeWidth={1.5} />}
        />,
    },
];
