import { createContext, useContext, type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type GlowButtonColor = 'neutral'| 'green' | 'purple' | 'blue' | 'red' | 'yellow';
export type GlowButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type GlowButtonVariant = 'glow' | 'solid';

export interface GlowButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'title'> {
  /** Texto principal do botão (use children para composição) */
  title?: string;
  /** Texto secundário (opcional) */
  subtitle?: string;
  /** Ícone (opcional) */
  icon?: ReactNode;
  /** Posição do ícone */
  iconPosition?: 'left' | 'right';
  /** Alinhamento do texto */
  textAlign?: 'left' | 'center' | 'right';
  /** Variante visual do botão */
  variant?: GlowButtonVariant;
  /** Cor do glow/borda */
  color?: GlowButtonColor;
  /** Tamanho geral (padding, texto, ícone) */
  size?: GlowButtonSize;
  /** Estado toggle pressionado (para botões toggle) */
  pressed?: boolean;
  /** Se ocupa 100% da largura */
  fullWidth?: boolean;
  /** Children para composição (GlowButtonIcon, GlowButtonTitle, GlowButtonSubtitle) */
  children?: ReactNode;
}

// Context para passar configurações para subcomponentes
interface GlowButtonContextValue {
  size: GlowButtonSize;
  sizeConfig: typeof sizeStyles[GlowButtonSize];
  textAlign: 'left' | 'center' | 'right';
  iconPosition: 'left' | 'right';
}

const GlowButtonContext = createContext<GlowButtonContextValue | null>(null);

function useGlowButtonContext() {
  const context = useContext(GlowButtonContext);
  if (!context) {
    throw new Error('GlowButton compound components must be used within GlowButton');
  }
  return context;
}

// Estilos de cor (enabled)
const colorStyles: Record<GlowButtonColor, string> = {
  neutral: 'border-neutral-500 shadow-[0_0_15px_rgba(115,115,115,0.4)] text-neutral-300 hover:bg-neutral-800/40',
  green: 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] text-green-400 hover:bg-green-900/40',
  purple: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] text-purple-400 hover:bg-purple-900/40',
  blue: 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] text-cyan-400 hover:bg-cyan-900/40',
  red: 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)] text-red-500 hover:bg-red-900/40',
  yellow: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)] text-yellow-400 hover:bg-yellow-900/40',
};

// Estilos de cor (disabled) - sem glow, cores apagadas
const disabledColorStyles: Record<GlowButtonColor, string> = {
  neutral: 'disabled:border-neutral-700/80 disabled:text-neutral-700/80 disabled:shadow-none',
  green: 'disabled:border-green-900/80 disabled:text-green-900/80 disabled:shadow-none',
  purple: 'disabled:border-purple-900/80 disabled:text-purple-900/80 disabled:shadow-none',
  blue: 'disabled:border-cyan-900/80 disabled:text-cyan-900/80 disabled:shadow-none',
  red: 'disabled:border-red-900/80 disabled:text-red-900/80 disabled:shadow-none',
  yellow: 'disabled:border-yellow-700/80 disabled:text-yellow-900/80 disabled:shadow-none',
};


const sizeStyles = {
  xs: {
    container: 'px-3 py-2 border-2 rounded',
    title: 'text-xs md:text-sm',
    subtitle: 'text-[10px]',
    iconSize: 'text-base',
    iconGap: 'gap-2',
  },
  sm: {
    container: 'px-4 py-2 border-2 rounded',
    title: 'text-base md:text-lg',
    subtitle: 'text-xs',
    iconSize: 'text-lg',
    iconGap: 'gap-3',
  },
  md: {
    container: 'px-6 py-4 border-4 rounded',
    title: 'text-xl md:text-2xl',
    subtitle: 'text-sm md:text-base',
    iconSize: 'text-2xl',
    iconGap: 'gap-4',
  },
  lg: {
    container: 'px-8 py-5 border-4 rounded',
    title: 'text-2xl md:text-3xl',
    subtitle: 'text-base md:text-lg',
    iconSize: 'text-3xl',
    iconGap: 'gap-5',
  },
} as const satisfies Record<GlowButtonSize, { container: string; title: string; subtitle: string; iconSize: string; iconGap: string }>;

// ============================================
// Compound Components
// ============================================

export interface GlowButtonIconProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/** Wrapper para ícone dentro do GlowButton */
export function GlowButtonIcon({ children, className, ...props }: GlowButtonIconProps) {
  const { sizeConfig } = useGlowButtonContext();
  return (
    <span className={cn('flex items-center justify-center shrink-0', sizeConfig.iconSize, className)} {...props}>
      {children}
    </span>
  );
}

export interface GlowButtonTitleProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/** Wrapper para título dentro do GlowButton */
export function GlowButtonTitle({ children, className, ...props }: GlowButtonTitleProps) {
  const { sizeConfig } = useGlowButtonContext();
  return (
    <span className={cn('tracking-widest font-pixel uppercase drop-shadow-md', sizeConfig.title, className)} {...props}>
      {children}
    </span>
  );
}

export interface GlowButtonSubtitleProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/** Wrapper para subtítulo dentro do GlowButton */
export function GlowButtonSubtitle({ children, className, ...props }: GlowButtonSubtitleProps) {
  const { sizeConfig } = useGlowButtonContext();
  return (
    <span className={cn('opacity-80 font-pixel tracking-wide', sizeConfig.subtitle, className)} {...props}>
      {children}
    </span>
  );
}

export interface GlowButtonTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

/** 
 * Wrapper para agrupar Title e Subtitle dentro do GlowButton.
 * Mantém o mesmo layout do modo props.
 */
export function GlowButtonText({ children, className, ...props }: GlowButtonTextProps) {
  const { textAlign, iconPosition } = useGlowButtonContext();
  const isCentered = textAlign === 'center';

  const getTextAlignment = () => {
    if (textAlign === 'center') return 'items-center text-center';
    if (textAlign === 'right') return 'items-end text-right';
    return iconPosition === 'right' ? 'items-end text-left' : 'items-start text-left';
  };

  return (
    <span className={cn('flex flex-col', !isCentered && 'flex-1', getTextAlignment(), className)} {...props}>
      {children}
    </span>
  );
}

// ============================================
// Main Component
// ============================================

export function GlowButton({
  title,
  subtitle,
  icon,
  iconPosition = 'left',
  textAlign = 'left',
  variant = 'glow',
  color = 'neutral',
  size = 'md',
  pressed,
  fullWidth = true,
  className,
  disabled,
  children,
  ...buttonProps
}: GlowButtonProps) {
  const sizeConfig = sizeStyles[size];
  const isCentered = textAlign === 'center';
  const isSolid = variant === 'solid';

  // Determina se usa children ou props
  const useComposition = !!children;

  // Elemento de ícone (modo props)
  const iconElement = icon ? (
    <span className={cn('flex items-center justify-center shrink-0', sizeConfig.iconSize)}>
      {icon}
    </span>
  ) : null;

  // Determina alinhamento do texto baseado em textAlign e iconPosition
  const getTextAlignment = () => {
    if (textAlign === 'center') return 'items-center text-center';
    if (textAlign === 'right') return 'items-end text-right';
    return iconPosition === 'right' ? 'items-end text-left' : 'items-start text-left';
  };

  // Elemento de texto (modo props)
  const textElement = title ? (
    <span className={cn('flex flex-col', !isCentered && 'flex-1', getTextAlignment())}>
      <span
        className={cn(
          'tracking-widest font-pixel uppercase drop-shadow-md',
          sizeConfig.title,
        )}
      >
        {title}
      </span>
      {subtitle && (
        <span className={cn('opacity-80 font-pixel tracking-wide', sizeConfig.subtitle)}>
          {subtitle}
        </span>
      )}
    </span>
  ) : null;

  // Estilos base compartilhados
  const baseStyles = cn(
    'group relative flex items-center',
    isCentered ? 'justify-center' : 'justify-between',
    sizeConfig.iconGap,
    'transition-all duration-200',
    'disabled:cursor-not-allowed',
    fullWidth && 'w-full',
    sizeConfig.container,
  );

  // Estilos especificos da variante
  const variantStyles = cn(
    // Fundo: solid usa fundo opaco, glow usa transparente com blur
    isSolid ? 'bg-neutral-900' : 'bg-neutral-900/80 backdrop-blur-xs',
    // Cores (enabled)
    colorStyles[color],
    // Cores (disabled) - específicas por cor
    disabledColorStyles[color],
    // Efeito de interacao
    'hover:scale-[1.02] active:scale-95 disabled:active:scale-101',
  );

  // Context value para subcomponentes
  const contextValue: GlowButtonContextValue = { size, sizeConfig, textAlign, iconPosition };

  // Conteúdo do botão
  const buttonContent = useComposition ? (
    // Modo composição: renderiza children diretamente
    children
  ) : (
    // Modo props: renderiza icon + text
    <>
      {iconPosition === 'left' && iconElement}
      {textElement}
      {iconPosition === 'right' && iconElement}
    </>
  );

  return (
    <GlowButtonContext.Provider value={contextValue}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={pressed}
        className={cn(baseStyles, variantStyles, className)}
        {...buttonProps}
      >
        {buttonContent}
      </button>
    </GlowButtonContext.Provider>
  );
}

