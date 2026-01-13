import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { CSSProperties } from 'react';

type PillSlot = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export interface PillScannerIconProps {
    className?: string;
    /**
     * Cor da pill exibida dentro do scanner.
     * - Se omitida, herda de currentColor (use Tailwind `text-*` no className).
     */
    pillColor?: string;
    /**
     * Slot para renderizar uma pill custom dentro do scanner.
     * Recomendação: passar um SVG "inline", ex. <PillIcon shadow={false} ... svgProps={{ x, y, width, height }} />
     * Se não for fornecido, usa a pill padrão do scanner.
     */
    pill?: ReactNode | ((slot: PillSlot) => ReactNode);
    decorative?: boolean;
    title?: string;
    /**
     * Tamanho em px (width/height do SVG).
     * Preferimos width/height em vez de classes dinâmicas `h-${n}` (Tailwind não gera isso).
     */
    size?: number;
    scale?: number;
    viewBox?: string;
}

export function PillScannerIcon({
    className,
    pillColor,
    pill,
    decorative = true,
    title = 'Pill Scanner',
    size = 24,
    scale = 0.25,
    viewBox,
}: PillScannerIconProps) {
    const uid = useId();
    const metalGradId = `scannerMetal-${uid}`;
    const screenGradId = `scannerScreen-${uid}`;
    const pillHoloGradId = `scannerPillHolo-${uid}`;
    const redBtnGradId = `scannerRedBtn-${uid}`;
    const glassShineId = `scannerGlass-${uid}`;
    const dropShadowId = `scannerShadow-${uid}`;
    // Mesmo bounding box da pill original no SVG (antes da rotação do grupo).
    const pillSlot: PillSlot = { x: 35, y: 10, width: 70, height: 40 };
    const pillNode = typeof pill === 'function' ? pill(pillSlot) : pill;
    const viewBoxAttr = viewBox || '0 0 512 512';
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBoxAttr}
            width={size}
            height={size}
            className={cn('select-none', className)}
            style={{
                // também define color para beneficiar pills que usam currentColor (ex.: <PillIcon />)
                color: pillColor,
                ...({ '--scanner-pill': pillColor ?? 'currentColor' } as CSSProperties),
            }}
            aria-hidden={decorative ? true : undefined}
            role={decorative ? undefined : 'img'}
            aria-label={decorative ? undefined : title}
        >
            {!decorative ? <title>{title}</title> : null}

            <defs>
                <linearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#555" />
                    <stop offset="50%" stopColor="#aaa" />
                    <stop offset="100%" stopColor="#555" />
                </linearGradient>

                <linearGradient id={screenGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0f2027" />
                    <stop offset="100%" stopColor="#203a43" />
                </linearGradient>

                <linearGradient id={pillHoloGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--scanner-pill)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--scanner-pill)" stopOpacity="0.4" />
                </linearGradient>

                <radialGradient id={redBtnGradId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff5e5e" />
                    <stop offset="100%" stopColor="#a00000" />
                </radialGradient>

                <linearGradient id={glassShineId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>

                <filter id={dropShadowId} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                    <feOffset dx="4" dy="4" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.5" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Main Device Group */}
            <g transform="translate(0, 20)" filter={`url(#${dropShadowId})`}>
                {/* Top Sensor Array / Antennae */}
                <g stroke="#1a1a1a" strokeWidth="3">
                    <rect x="160" y="20" width="20" height="60" fill={`url(#${metalGradId})`} rx="5" />
                    <circle cx="170" cy="20" r="12" fill="#ffcc00" stroke="#1a1a1a" strokeWidth="2" />

                    <rect x="332" y="20" width="20" height="60" fill={`url(#${metalGradId})`} rx="5" />
                    <circle cx="342" cy="20" r="12" fill="#ffcc00" stroke="#1a1a1a" strokeWidth="2" />

                    <path d="M180 60 H332" stroke="#555" strokeWidth="8" />
                </g>

                {/* Main Chassis Body */}
                <path
                    d="M130,80 L382,80 C400,80 412,95 412,115 L412,420 C412,450 390,470 360,470 L152,470 C122,470 100,450 100,420 L100,115 C100,95 112,80 130,80 Z"
                    fill="#a8d5e2"
                    stroke="#1a1a1a"
                    strokeWidth="4"
                />

                {/* Body Depth/Highlight */}
                <path
                    d="M110,115 L110,420 C110,440 125,460 152,460 L360,460 C387,460 402,440 402,420 L402,115"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="4"
                    opacity="0.3"
                />
                <path
                    d="M130,80 L382,80"
                    stroke="#ffffff"
                    strokeWidth="2"
                    opacity="0.5"
                    transform="translate(0, 5)"
                />

                {/* Screen Bezel */}
                <rect x="140" y="120" width="232" height="180" rx="10" fill="#333" stroke="#1a1a1a" strokeWidth="3" />

                {/* Screen Display */}
                <g transform="translate(150, 130)">
                    <rect width="212" height="160" fill={`url(#${screenGradId})`} rx="5" />

                    <path
                        d="M0,40 H212 M0,80 H212 M0,120 H212 M53,0 V160 M106,0 V160 M159,0 V160"
                        stroke="#00ff00"
                        strokeWidth="1"
                        opacity="0.15"
                    />

                    <g fill="#00ff00" fontFamily="monospace" fontSize="10" opacity="0.8">
                        <text x="10" y="20">
                            ANALYZING...
                        </text>
                        <text x="10" y="145">
                            COMP: UNKNOWN
                        </text>
                        <text x="150" y="20" textAnchor="end">
                            98%
                        </text>
                    </g>

                    {/* Pill Graphic (customizável) */}
                    {pillNode ? (
                        <g transform={`translate(${pillSlot.x} ${pillSlot.y}) scale(${scale})`}>{pillNode}</g>
                    ) : (
                        <g transform="translate(106, 80) rotate(45)">
                            <path
                                d="M-30,-15 L0,-15 L0,15 L-30,15 A15,15 0 0 1 -30,-15"
                                fill="var(--scanner-pill)"
                                stroke="#fff"
                                strokeWidth="1"
                            />
                            <path
                                d="M0,-15 L30,-15 A15,15 0 0 1 30,15 L0,15 L0,-15"
                                fill="#ffffff"
                                stroke="#fff"
                                strokeWidth="1"
                            />
                            <rect x="-35" y="-20" width="70" height="40" rx="20" fill={`url(#${pillHoloGradId})`} opacity="0.3" />
                        </g>
                    )}

                    {/* Scanning line */}
                    <rect x="10" y="50" width="192" height="2" fill="#00ff00" opacity="0.8">
                        <animate attributeName="y" values="40;120;40" dur="2s" repeatCount="indefinite" />
                    </rect>

                    <path d="M0,0 L212,0 L212,100 L0,40 Z" fill={`url(#${glassShineId})`} opacity="0.3" />
                </g>

                {/* Control Panel Area */}
                <g transform="translate(140, 320)">
                    <rect x="0" y="0" width="232" height="120" rx="10" fill="rgba(0,0,0,0.1)" />

                    <circle cx="50" cy="60" r="35" fill={`url(#${redBtnGradId})`} stroke="#500" strokeWidth="2" />
                    <circle cx="50" cy="60" r="25" fill="none" stroke="#ffaaaa" strokeWidth="2" opacity="0.5" />

                    <circle cx="180" cy="60" r="30" fill="#444" stroke="#111" strokeWidth="2" />
                    <circle cx="180" cy="60" r="22" fill="#222" />
                    <rect x="176" y="35" width="8" height="20" fill="#fff" rx="2" transform="rotate(45 180 60)" />

                    <circle cx="115" cy="40" r="6" fill="#00ff00" stroke="#004400" strokeWidth="1" />
                    <circle cx="115" cy="60" r="6" fill="#333" stroke="#111" strokeWidth="1" />
                    <circle cx="115" cy="80" r="6" fill="#333" stroke="#111" strokeWidth="1" />

                    <g fill="#333">
                        <rect x="140" y="100" width="60" height="4" rx="2" />
                        <rect x="140" y="108" width="60" height="4" rx="2" />
                    </g>
                </g>

                {/* Screw Heads */}
                <g fill="#bbb" stroke="#555" strokeWidth="1">
                    <circle cx="120" cy="100" r="4" />
                    <circle cx="392" cy="100" r="4" />
                    <circle cx="120" cy="450" r="4" />
                    <circle cx="392" cy="450" r="4" />
                    <path
                        d="M117,100 H123 M389,100 H395 M117,450 H123 M389,450 H395"
                        stroke="#444"
                        strokeWidth="1"
                    />
                </g>
            </g>
        </svg>
    );
}


