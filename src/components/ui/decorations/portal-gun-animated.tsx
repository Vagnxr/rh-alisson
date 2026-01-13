import { cn } from '@/lib/cn';

interface PortalGunAnimatedProps {
  /** Tamanho do componente. Default: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Rotacao em graus. Default: 12 */
  rotation?: number;
  /** Ativar animacao de glow. Default: true */
  glowEnabled?: boolean;
  /** Ativar animacao de bounce. Default: true */
  bounceEnabled?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

const sizeClasses = {
  sm: 'size-32',
  md: 'size-40',
  lg: 'size-56',
};

const IMAGE_SRC = '/images/animation/portal_gun.png';

/**
 * Portal Gun Animado - Decoracao com animacao de bounce e glow verde
 *
 * Comportamentos:
 * - Bounce suave (quando habilitado)
 * - Glow verde pulsante
 *
 * TODO: Adicionar animacoes extras quando imagens extras estiverem disponiveis
 */
export function PortalGunAnimated({
  size = 'md',
  rotation = 12,
  glowEnabled = true,
  bounceEnabled = true,
  className,
}: PortalGunAnimatedProps) {
  return (
    <div className={cn(bounceEnabled && 'animate-bounce')}>
      <img
        src={IMAGE_SRC}
        alt="Portal Gun"
        className={cn(
          sizeClasses[size],
          'object-contain select-none',
          glowEnabled && 'animate-glow-green',
          'png-outline',
          className,
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
        draggable={false}
      />
    </div>
  );
}
