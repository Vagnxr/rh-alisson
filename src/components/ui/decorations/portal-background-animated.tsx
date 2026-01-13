import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/cn';

interface PortalBackgroundAnimatedProps {
  /**
   * Classe extra para o wrapper (normalmente um container absolute).
   */
  className?: string;
  /**
   * Opacidade do portal (0..1). Default: 0.55
   */
  opacity?: number;
  /**
   * Ajuste de encaixe do SVG no container.
   * - 'cover': corta as bordas para preencher (slice)
   * - 'contain': mostra tudo (meet)
   */
  fit?: 'cover' | 'contain';
  /**
   * Se true, mantém o portal “estático” (sem animações SMIL).
   * Default: false
   */
  staticMode?: boolean;
  /**
   * Preset de qualidade/performance do filtro do portal.
   * - 'balanced' (default): prioriza performance mantendo o “look”
   * - 'high': mais bonito, mais pesado
   * - 'low': mais leve, menos detalhe
   */
  quality?: 'high' | 'balanced' | 'low';
  /**
   * Escala do portal (reduz a área do filtro => mais performance).
   * Default depende do quality:
   * - high: 1
   * - balanced: 0.85
   * - low: 0.75
   */
  portalScale?: number;
  /**
   * Quanto de “movimento” do goo (feTurbulence) queremos.
   * - 'full': anima o turbulence (mais pesado)
   * - 'lite': anima mais lentamente e com menos variação
   * - 'off': desliga o filtro “goo” (muito mais leve) mantendo o portal “simple”
   */
  gooMotion?: 'full' | 'lite' | 'off';
  /**
   * Densidade de estrelas (e custo associado).
   * - 'full': mais estrelas + blur
   * - 'lite': menos estrelas + blur menor
   * - 'off': sem estrelas
   */
  stars?: 'full' | 'lite' | 'off';
}

export function PortalBackgroundAnimated({
  className,
  opacity = 0.55,
  fit = 'cover',
  staticMode = false,
  quality = 'balanced',
  portalScale,
  gooMotion,
  stars,
}: PortalBackgroundAnimatedProps) {
  const uid = useId();
  const portalGradientId = `portalGradient-${uid}`;
  const portalFilterId = `rickPortalFilter-${uid}`;
  const starGlowId = `starGlow-${uid}`;

  const preserveAspectRatio = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const onChange = () => setPrefersReducedMotion(media.matches);
    onChange();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const effectiveStaticMode = staticMode || prefersReducedMotion;

  const effectiveGooMotion: 'full' | 'lite' | 'off' =
    gooMotion ?? (quality === 'high' ? 'full' : quality === 'balanced' ? 'lite' : 'off');

  const effectiveStars: 'full' | 'lite' | 'off' =
    stars ?? (quality === 'high' ? 'full' : quality === 'balanced' ? 'lite' : 'off');

  const qualityConfig = (() => {
    if (quality === 'high') {
      return {
        filterBounds: { x: '-50%', y: '-50%', width: '200%', height: '200%' },
        filterRes: undefined as string | undefined,
        portalScale: 1,
        turbulenceBaseFrequencyAnim: '0.05;0.06;0.04;0.05',
        turbulenceBaseFrequencyStatic: '0.05',
        turbulenceOctaves: 4,
        displacementScale: 45,
        blurDisplaced: 2,
        blurGlow: 5,
        starGlowBlur: 1.5,
      };
    }
    if (quality === 'low') {
      return {
        filterBounds: { x: '-30%', y: '-30%', width: '160%', height: '160%' },
        filterRes: '192 192',
        portalScale: 0.75,
        turbulenceBaseFrequencyAnim: '0.055;0.058;0.052;0.055',
        turbulenceBaseFrequencyStatic: '0.055',
        turbulenceOctaves: 2,
        displacementScale: 18,
        blurDisplaced: 1.2,
        blurGlow: 3,
        starGlowBlur: 0.8,
      };
    }
    // balanced (default): performance-first, mas mantendo o “goo”
    return {
      filterBounds: { x: '-35%', y: '-35%', width: '170%', height: '170%' },
      filterRes: '224 224',
      portalScale: 0.8,
      turbulenceBaseFrequencyAnim: '0.055;0.058;0.052;0.055',
      turbulenceBaseFrequencyStatic: '0.055',
      turbulenceOctaves: 2,
      displacementScale: 22,
      blurDisplaced: 1.4,
      blurGlow: 3.2,
      starGlowBlur: 1.0,
    };
  })();

  const effectivePortalScale = portalScale ?? qualityConfig.portalScale;
  const enableGooFilter = effectiveGooMotion !== 'off' && quality !== 'low';
  const enableGooAnimation = enableGooFilter && !effectiveStaticMode;
  const gooAnimValues =
    effectiveGooMotion === 'full'
      ? qualityConfig.turbulenceBaseFrequencyAnim
      : '0.055;0.056;0.054;0.055';
  const gooAnimDuration = effectiveGooMotion === 'full' ? '3s' : '6s';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        'top-[calc(100dvh-100%)]',
        className,
      )}
      style={{ opacity }}
    >
      {/* Star field simulation */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Portal Background */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        preserveAspectRatio={preserveAspectRatio}
        className="h-full w-full"
      >
        <defs>
          <radialGradient id={portalGradientId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#eaff00" stopOpacity="1" />
            <stop offset="45%" stopColor="#39ff14" stopOpacity="1" />
            <stop offset="70%" stopColor="#008f11" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#003300" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {enableGooFilter ? (
            <filter
              id={portalFilterId}
              x={qualityConfig.filterBounds.x}
              y={qualityConfig.filterBounds.y}
              width={qualityConfig.filterBounds.width}
              height={qualityConfig.filterBounds.height}
              filterRes={qualityConfig.filterRes}
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={qualityConfig.turbulenceBaseFrequencyStatic}
                numOctaves={qualityConfig.turbulenceOctaves}
                seed={1}
                result="noise"
              >
                {enableGooAnimation ? (
                  <animate
                    attributeName="baseFrequency"
                    values={gooAnimValues}
                    dur={gooAnimDuration}
                    repeatCount="indefinite"
                  />
                ) : null}
              </feTurbulence>

              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={qualityConfig.displacementScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              <feGaussianBlur in="displaced" stdDeviation={qualityConfig.blurDisplaced} result="blurred" />
              <feColorMatrix
                in="blurred"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="goo"
              />
              <feGaussianBlur in="goo" stdDeviation={qualityConfig.blurGlow} result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="goo" />
              </feMerge>
            </filter>
          ) : null}

          <filter id={starGlowId}>
            <feGaussianBlur stdDeviation={qualityConfig.starGlowBlur} />
          </filter>
        </defs>

        {/* Stars */}
        {effectiveStars === 'off' ? null : (
          <g>
            {/* Lite: menos estrelas e animação mais suave */}
            <circle cx="50" cy="80" r="2" fill="#39ff14" filter={`url(#${starGlowId})`} opacity="0.75">
              {!effectiveStaticMode ? (
                <animate attributeName="opacity" values="0.2;0.9;0.2" dur="4s" repeatCount="indefinite" begin="0s" />
              ) : null}
            </circle>
            <circle cx="450" cy="120" r="1.5" fill="#39ff14" filter={`url(#${starGlowId})`} opacity="0.65">
              {!effectiveStaticMode ? (
                <animate attributeName="opacity" values="0.2;1;0.2" dur="5s" repeatCount="indefinite" begin="1s" />
              ) : null}
            </circle>
            <circle cx="400" cy="60" r="2" fill="#b026ff" filter={`url(#${starGlowId})`} opacity="0.6">
              {effectiveStars === 'full' && !effectiveStaticMode ? (
                <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="1.5s" />
              ) : null}
            </circle>
            <circle cx="150" cy="480" r="1.5" fill="#b026ff" filter={`url(#${starGlowId})`} opacity="0.55">
              {effectiveStars === 'full' && !effectiveStaticMode ? (
                <animate attributeName="opacity" values="0;1;0" dur="3.2s" repeatCount="indefinite" begin="2.5s" />
              ) : null}
            </circle>

            {effectiveStars === 'full' ? (
              <>
                <circle cx="100" cy="400" r="2" fill="#39ff14" filter={`url(#${starGlowId})`}>
                  {!effectiveStaticMode ? (
                    <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
                  ) : null}
                </circle>
                <circle cx="380" cy="450" r="1.8" fill="#39ff14" filter={`url(#${starGlowId})`}>
                  {!effectiveStaticMode ? (
                    <animate attributeName="opacity" values="0;1;0" dur="3.5s" repeatCount="indefinite" begin="2s" />
                  ) : null}
                </circle>
                <circle cx="80" cy="200" r="1.5" fill="#b026ff" filter={`url(#${starGlowId})`}>
                  {!effectiveStaticMode ? (
                    <animate attributeName="opacity" values="0;1;0" dur="4.5s" repeatCount="indefinite" begin="0s" />
                  ) : null}
                </circle>
                <circle cx="480" cy="300" r="2.2" fill="#b026ff" filter={`url(#${starGlowId})`}>
                  {!effectiveStaticMode ? (
                    <animate attributeName="opacity" values="0;1;0" dur="2.8s" repeatCount="indefinite" begin="1s" />
                  ) : null}
                </circle>
                <circle cx="20" cy="300" r="1" fill="#b026ff" filter={`url(#${starGlowId})`}>
                  {!effectiveStaticMode ? (
                    <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.2s" />
                  ) : null}
                </circle>
              </>
            ) : null}
          </g>
        )}

        {/* Portal */}
        <g transform={`translate(256, 256) scale(${effectivePortalScale})`}>
          {!effectiveStaticMode ? (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="-360 0 0"
              dur="20s"
              repeatCount="indefinite"
              additive="sum"
            />
          ) : null}

          {enableGooFilter ? (
            <g filter={`url(#${portalFilterId})`}>
              <ellipse cx="0" cy="0" rx="180" ry="220" fill={`url(#${portalGradientId})`} />
              <path
                d="M-50,-100 Q50,-150 100,-50 T50,100 T-100,50 T-50,-100"
                fill="none"
                stroke="#ccff00"
                strokeWidth={20}
                opacity="0.5"
              />
              <path
                d="M20,20 Q80,0 60,80 T-40,60 T20,20"
                fill="none"
                stroke="#ffffff"
                strokeWidth={10}
                opacity="0.3"
              />
            </g>
          ) : (
            // Simple portal: barato (sem filter), ainda com volume visual
            <g>
              <ellipse cx="0" cy="0" rx="180" ry="220" fill={`url(#${portalGradientId})`} opacity="0.95" />
              <ellipse cx="0" cy="0" rx="150" ry="190" fill="#39ff14" opacity="0.12" />
              <ellipse cx="0" cy="0" rx="120" ry="150" fill="#ffffff" opacity="0.07" />
              <path
                d="M-50,-100 Q50,-150 100,-50 T50,100 T-100,50 T-50,-100"
                fill="none"
                stroke="#ccff00"
                strokeWidth={14}
                opacity="0.35"
              />
            </g>
          )}

          <circle cx="190" cy="0" r="5" fill="#39ff14" filter={`url(#${starGlowId})`} opacity="0.8" />
          <circle cx="-180" cy="40" r="8" fill="#39ff14" filter={`url(#${starGlowId})`} opacity="0.6" />
          <circle cx="0" cy="-230" r="6" fill="#39ff14" filter={`url(#${starGlowId})`} opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}

