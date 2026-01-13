import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function PanelShell({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'bg-none backdrop-blur-xs rounded-xl',
                'py-2',
                'mb-2 md:mb-4',
                'min-h-0',
                className,
            )}
        >
            {children}
        </div>
    );
}