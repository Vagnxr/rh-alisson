import { useId } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import { cn } from '@/lib/cn';

export interface PillIconProps {
  className?: string;
  /**
   * Cor principal (a “tampa” da pill).
   * - Se omitida, herda do currentColor (use Tailwind `text-*` no className).
   */
  primaryColor?: string;
  /**
   * Cor da metade branca.
   */
  whiteColor?: string;
  /**
   * Acessibilidade:
   * - Se `decorative` for true, o SVG fica aria-hidden.
   * - Caso contrário, use `title` para label.
   */
  decorative?: boolean;
  title?: string;
  /**
   * Controle de canvas (viewBox) para evitar "bleeding area".
   * - 'tight' (default): corta o excesso e deixa o desenho preencher melhor o ícone.
   * - 'none': usa o viewBox original (0 0 512 512).
   */
  trim?: 'tight' | 'none';
  /**
   * Permite sobrescrever manualmente o viewBox (útil para ajustes finos).
   * Ex.: "86 119 340 274"
   */
  viewBox?: string;
  /**
   * Drop shadow (filter). Se você quiser zero overflow visual, pode desligar.
   */
  shadow?: boolean;
  /**
   * Props nativas do elemento <svg>. Útil para usar o PillIcon como "filho" de outro SVG
   * (ex.: passar x/y/width/height).
   */
  svgProps?: SVGProps<SVGSVGElement>;
}

const VIEWBOX_ORIGINAL = '0 0 512 512';
// Bounding box aproximado do pill (rotacionado) com padding leve, sem considerar o filtro.
const VIEWBOX_TIGHT = '86 119 340 274';

export function PillIcon({
  className = 'h-6 w-6',
  primaryColor,
  whiteColor = '#f7f9fc',
  decorative = true,
  title = 'Pill',
  trim = 'tight',
  viewBox,
  shadow = true,
  svgProps,
}: PillIconProps) {
  const uid = useId();
  const filterId = `pillDropShadow-${uid}`;
  const cylinderId = `pillCylinder-${uid}`;
  const glossId = `pillGloss-${uid}`;
  const shapeId = `pillShape-${uid}`;
  const clipId = `pillClip-${uid}`;
  const { className: svgClassName, style: svgStyle, ...restSvgProps } = svgProps ?? {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox ?? (trim === 'tight' ? VIEWBOX_TIGHT : VIEWBOX_ORIGINAL)}
      className={cn('select-none', className, svgClassName)}
      // Importante: permite que o drop-shadow apareça mesmo com viewBox "tight".
      overflow={shadow ? 'visible' : 'hidden'}
      style={{
        ...svgStyle,
        // default: herda de currentColor
        ...({ '--pill-primary': primaryColor ?? 'currentColor', '--pill-white': whiteColor } as CSSProperties),
      }}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : title}
      {...restSvgProps}
    >
      {!decorative ? <title>{title}</title> : null}

      <defs>
        {shadow ? (
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur" />
            <feOffset in="blur" dx="8" dy="12" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ) : null}

        <linearGradient id={cylinderId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0" />
          <stop offset="85%" stopColor="#000000" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id={glossId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="20%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>

        <rect id={shapeId} x="106" y="196" width="300" height="120" rx="60" ry="60" />
        <clipPath id={clipId}>
          <use href={`#${shapeId}`} />
        </clipPath>
      </defs>

      <g transform="rotate(-30 256 256)" filter={shadow ? `url(#${filterId})` : undefined}>
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M 256,196 L 166,196 A 60,60 0 0,0 166,316 L 256,316 Z"
            fill="var(--pill-white, #f7f9fc)"
          />
          <path
            d="M 256,196 L 346,196 A 60,60 0 0,1 346,316 L 256,316 Z"
            fill="var(--pill-primary, currentColor)"
          />

          <rect
            x="106"
            y="196"
            width="300"
            height="120"
            rx="60"
            ry="60"
            fill={`url(#${cylinderId})`}
            style={{ pointerEvents: 'none' }}
          />
          <rect x="254" y="196" width="2" height="120" fill="#000000" opacity="0.1" />
          <path
            d="M 136,210 L 376,210 A 45,45 0 0,1 376,250 L 136,250 A 45,45 0 0,1 136,210 Z"
            fill={`url(#${glossId})`}
            opacity="0.5"
            transform="scale(0.95) translate(12, 5)"
          />
          <path
            d="M 146,300 L 366,300"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.2"
          />
        </g>
      </g>
    </svg>
  );
}


