import type { ReactNode } from 'react';
import { GlowButton, GlowButtonTitle, GlowButtonSubtitle, type GlowButtonColor, GlowButtonIcon, GlowButtonText } from '@/components/ui/glow-button';

export interface HomeMenuButtonProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  color: GlowButtonColor;
  onClick?: () => void;
}

/**
 * Wrapper do GlowButton para uso na HomeScreen.
 * Mantido para compatibilidade e semântica específica do menu inicial.
 */
export function HomeMenuButton({ title, subtitle, icon, color, onClick }: HomeMenuButtonProps) {
  return (
    <GlowButton
      color={color}
      onClick={onClick}
      size="md"
      className="mb-4"
    >
      <GlowButtonIcon>{icon}</GlowButtonIcon>
      <GlowButtonText>
        <GlowButtonTitle className="font-extrabold">{title}</GlowButtonTitle>
        <GlowButtonSubtitle>{subtitle}</GlowButtonSubtitle>
      </GlowButtonText>
    </GlowButton>
  );
}
