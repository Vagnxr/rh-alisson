import { cn } from "@/lib/cn";

import type { ReactNode } from "react";

export function SectionHeader({
    icon,
    title,
    className = '',
    playerName,
}: {
    icon: ReactNode;
    title: ReactNode;
    className?: string;
    playerName?: string;
}) {
    return (
        <div className={cn('text-text-muted border-border-muted flex items-center gap-2 pb-3', className)}>
            {icon}
            {playerName ? <span className="text-xs text-text-muted">{playerName}</span> : null}
            <h2 className="text-xs uppercase">{title}</h2>
        </div>
    );
}