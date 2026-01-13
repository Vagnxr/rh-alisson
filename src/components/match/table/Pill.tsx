
import { PillIcon } from '@/components/ui/icons/pill-icon';
import { cn } from '@/lib/cn';
import type { IPill } from '@/types/game';

interface PillProps {
    type: IPill['type'];
    revealed: boolean;
    className?: string;
    onClick?: () => void;
}

const PILL_COLORS: Record<string, string> = {
    SAFE: 'var(--color-pill-safe)',      // Azul
    POISON: 'var(--color-neon-purple)',   // Roxo
    TOXIC: 'var(--color-neon-yellow)',    // Amarelo
    ANTIDOTE: 'var(--color-pill-heal)',   // Verde
    LETHAL: 'var(--color-neon-red)',      // Vermelho
    UNKNOWN: '#666666',                   // Cinza (Unrevealed)
};

export function Pill({ type, revealed, className, onClick }: PillProps) {
    const color = revealed ? PILL_COLORS[type] || PILL_COLORS.UNKNOWN : PILL_COLORS.UNKNOWN;

    // Animação de entrada
    const animationClass = "animate-in zoom-in-50 duration-300";

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative group transition-transform active:scale-95 outline-hidden",
                animationClass,
                className
            )}
            title={revealed ? type : 'Unknown Pill'}
        >
            <PillIcon
                primaryColor={color}
                className={cn("w-12 h-12 md:w-16 md:h-16 filter drop-shadow-md transition-all group-hover:brightness-110",
                    !revealed && "opacity-80 group-hover:opacity-100"
                )}
                shadow={true}
            />

            {!revealed && (
                <span className="absolute inset-0 flex items-center justify-center font-bold text-white/50 text-xl pointer-events-none select-none">
                    ?
                </span>
            )}
        </button>
    );
}
