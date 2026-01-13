import { useId } from 'react';
import type { SVGProps } from 'react';
import { cn } from '@/lib/cn';
import type { CSSProperties } from 'react';

export interface PortalGunIconProps {
  className?: string;
  /**
   * Cor do “glow” verde (bulbo e lentes).
   * - Se omitida, herda de currentColor (use Tailwind `text-*` no className).
   */
  glowColor?: string;
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
   */
  viewBox?: string;
  /**
   * Glow (filter). Se você quiser zero overflow visual, pode desligar.
   */
  glow?: boolean;
  /**
   * Props nativas do elemento <svg> (útil para usar como filho de outro SVG: x/y/width/height etc.).
   */
  svgProps?: SVGProps<SVGSVGElement>;
}

const VIEWBOX_ORIGINAL = '0 0 512 512';
// Aproximação do bounding box do pixel-art (translate(32,32) scale(14)) com padding leve.
// Conteúdo ocupa ~x:4..28 e y:8..30 em unidades do pixel-art.
const VIEWBOX_TIGHT = '88 144 336 308';

export function PortalGunIcon({
  className = 'h-6 w-6',
  glowColor,
  decorative = true,
  title = 'Portal Gun',
  trim = 'tight',
  viewBox,
  glow = true,
  svgProps,
}: PortalGunIconProps) {
  const uid = useId();
  const glowId = `portalGunGlow-${uid}`;
  const { className: svgClassName, style: svgStyle, ...restSvgProps } = svgProps ?? {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox ?? (trim === 'tight' ? VIEWBOX_TIGHT : VIEWBOX_ORIGINAL)}
      shapeRendering="crispEdges"
      className={cn('select-none', className, svgClassName)}
      // Importante: permite que o glow apareça mesmo com viewBox "tight".
      overflow={glow ? 'visible' : 'hidden'}
      style={{
        ...svgStyle,
        color: glowColor,
        ...({ '--portal-gun-glow': glowColor ?? 'currentColor' } as CSSProperties),
      }}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : title}
      {...restSvgProps}
    >
      {!decorative ? <title>{title}</title> : null}

      <defs>
        {glow ? (
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        ) : null}
      </defs>

      {/* Pixel art group */}
      <g transform="translate(32, 32) scale(14)">
        {/* 1. THICK BLACK OUTLINE (Silhouette) */}
        <path
          fill="#111111"
          d="M 6 20 H 10 V 16 H 12 V 14 H 14 V 10 H 16 V 8 H 22 V 10 H 24 V 12 H 26 V 14 H 28 V 20 H 26 V 22 H 24 V 24 H 16 V 22 H 14 V 26 H 12 V 30 H 4 V 22 H 6 Z"
        />

        {/* 2. HANDLE */}
        <path
          fill="#B0BEC5"
          d="M 5 22 H 11 V 26 H 13 V 22 H 15 V 21 H 11 V 17 H 5 Z"
        />
        <path
          fill="#78909C"
          d="M 11 22 H 13 V 26 H 11 V 29 H 5 V 22 H 6 V 21 H 11 Z
             M 11 17 H 12 V 21 H 11 Z"
        />
        <path
          fill="#ECEFF1"
          d="M 5 22 V 21 H 6 V 18 H 7 V 17 H 11 V 21 H 6 V 22 Z"
        />

        {/* 3. MAIN BODY */}
        <path
          fill="#CFD8DC"
          d="M 11 16 H 13 V 14 H 15 V 12 H 23 V 14 H 25 V 19 H 23 V 21 H 15 V 19 H 13 V 17 H 11 Z"
        />
        <path
          fill="#90A4AE"
          d="M 15 19 H 23 V 21 H 15 Z
             M 23 14 H 25 V 19 H 23 Z
             M 13 17 H 15 V 19 H 13 Z"
        />
        <path
          fill="#FFFFFF"
          fillOpacity="0.6"
          d="M 11 16 H 13 V 14 H 15 V 12 H 23 V 13 H 15 V 15 H 13 V 17 H 11 Z"
        />

        {/* Red Detail */}
        <path fill="#D32F2F" d="M 16 16 H 18 V 18 H 16 Z" />
        <path fill="#FFCDD2" d="M 16 16 H 17 V 17 H 16 Z" />

        {/* 4. TOP BULB */}
        <path fill="#2E7D32" d="M 16 9 H 22 V 12 H 16 Z" />
        <path
          fill="var(--portal-gun-glow, currentColor)"
          filter={glow ? `url(#${glowId})` : undefined}
          d="M 17 10 H 21 V 11 H 17 Z
             M 16 11 H 22 V 12 H 16 Z"
        />
        <path fill="#FFFFFF" fillOpacity="0.9" d="M 17 9 H 19 V 10 H 17 Z" />
        <path fill="#B9F6CA" d="M 20 11 H 21 V 12 H 20 Z" />

        {/* 5. FRONT EMITTER */}
        <path fill="#37474F" d="M 25 13 H 27 V 19 H 25 Z" />
        <path fill="#263238" d="M 26 13 H 27 V 19 H 26 Z" />

        {/* 6. GLOWING LENSES */}
        <g filter={glow ? `url(#${glowId})` : undefined}>
          <path fill="var(--portal-gun-glow, currentColor)" d="M 27 14 H 28 V 15 H 27 Z" />
          <path fill="var(--portal-gun-glow, currentColor)" d="M 27 16 H 28 V 17 H 27 Z" />
          <path fill="var(--portal-gun-glow, currentColor)" d="M 27 18 H 28 V 19 H 27 Z" />
        </g>

        {/* 7. FINAL OUTLINE TOUCHUPS */}
        <path fill="#111111" d="M 11 21 H 15 V 22 H 11 Z" />
        <path fill="#111111" d="M 15 12 H 23 V 13 H 15 Z" />
      </g>
    </svg>
  );
}


