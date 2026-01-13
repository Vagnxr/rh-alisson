import { ReactNode } from 'react';
interface PixelCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'active' | 'player';
}
export const PixelCard = ({ children, className = '', variant = 'default' }: PixelCardProps) => {
  const borderColors = {
    default: 'border-neon-purple',
    active: 'border-portal-blue shadow-neon-purple',
    player: 'border-neon-green shadow-neon-green',
  };
  return (
    <div
      className={`bg-panel relative border-4 ${borderColors[variant]} shadow-pixel rounded-sm p-2 ${className}`}
    >
      {children}
    </div>
  );
};
