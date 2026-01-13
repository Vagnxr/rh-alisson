import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const lobbyButtonVariants = cva(
  'font-pixel inline-flex items-center justify-center gap-2 rounded-lg border-b-8 px-4 py-2 text-xs uppercase transition-all active:translate-y-2 active:border-b-0',
  {
    variants: {
      variant: {
        primary: 'border-neon-green/70 bg-neon-green text-space-black hover:bg-neon-green/80',
        secondary: 'border-portal-blue/70 bg-portal-blue text-space-black hover:bg-portal-blue/80',
        neutral: 'border-border-muted bg-neutral-700 text-text-primary hover:bg-neutral-600',
      },
      state: {
        default: '',
        disabled: 'cursor-not-allowed opacity-50',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      state: 'default',
    },
  },
);

export type LobbyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof lobbyButtonVariants>;

export function LobbyButton({ className, variant, state, disabled, ...props }: LobbyButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        lobbyButtonVariants({ variant, state: disabled ? 'disabled' : state }),
        className,
      )}
      {...props}
    />
  );
}
