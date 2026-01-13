import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { ScrollArea } from '@/components/ui/scroll-area';

type Vec2 = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export interface DevDockProps {
  children: React.ReactNode;
}

const ANIM_DURATION = 200; // ms
const COLLAPSED_WIDTH_PX = 120;
const COLLAPSED_HEIGHT_PX = 52;
const EXPANDED_MAX_WIDTH_PX = 420;
const EXPANDED_HEIGHT_VH = 80; // max-h-[80vh]

export function DevDock({ children }: DevDockProps) {
  // Intenção do usuário (abrir/fechar). Usado só para encadear a etapa seguinte via transitionend.
  const [desiredOpen, setDesiredOpen] = useState(false);
  // Flags de etapa (sequencial): largura -> altura (abrir) / altura -> largura (fechar)
  const [widthExpanded, setWidthExpanded] = useState(false);
  const [heightExpanded, setHeightExpanded] = useState(false);

  const [dockPos, setDockPos] = useState<Vec2>({ x: 24, y: 24 });

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const isTransitioning = (desiredOpen && widthExpanded && !heightExpanded) || (!desiredOpen && widthExpanded);

  const toggle = () => {
    if (isTransitioning) return;

    if (!desiredOpen) {
      // Abrir: 1) expande para direita (largura). A altura será expandida quando a largura terminar.
      setDesiredOpen(true);
      setWidthExpanded(true);
      // Mantém heightExpanded false até o fim da transição de width.
      return;
    }

    // Fechar: 1) colapsa para cima (altura). A largura será colapsada quando a altura terminar.
    setDesiredOpen(false);
    setHeightExpanded(false);
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    if (event.propertyName === 'width') {
      // Abrir: quando a largura terminar, expande a altura.
      if (desiredOpen && widthExpanded && !heightExpanded) {
        setHeightExpanded(true);
      }
      return;
    }

    if (event.propertyName === 'max-height') {
      // Fechar: quando a altura terminar de colapsar, colapsa a largura.
      if (!desiredOpen && !heightExpanded && widthExpanded) {
        setWidthExpanded(false);
      }
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button,select,option,input,textarea,a')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: dockPos.x,
      originY: dockPos.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    const expandedWidth = Math.min(window.innerWidth * 0.92, EXPANDED_MAX_WIDTH_PX);
    const currentWidth = widthExpanded ? expandedWidth : COLLAPSED_WIDTH_PX;

    const expandedHeight = Math.min(window.innerHeight * (EXPANDED_HEIGHT_VH / 100), window.innerHeight);
    const currentHeight = heightExpanded ? expandedHeight : COLLAPSED_HEIGHT_PX;

    const maxX = window.innerWidth - currentWidth - 8;
    const maxY = window.innerHeight - currentHeight - 8;

    const nextX = clamp(drag.originX + dx, 8, maxX);
    const nextY = clamp(drag.originY + dy, 8, maxY);
    setDockPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
  };

  return (
    <div
      style={{ position: 'fixed', left: dockPos.x, top: dockPos.y }}
      className="z-60"
    >
      <div
        onTransitionEnd={handleTransitionEnd}
        style={{
          touchAction: 'none',
          transitionDuration: `${ANIM_DURATION}ms`,
        }}
        className={cn(
          'rounded border-2 border-neutral-700 bg-neutral-950/95 backdrop-blur',
          'shadow-[0_12px_40px_rgba(0,0,0,0.65)]',
          'overflow-hidden',
          'flex flex-col',
          'transition-[width,max-height] ease-out',
          // Largura
          widthExpanded ? 'w-[min(92vw,420px)]' : 'w-[120px]',
          // Altura maxima
          heightExpanded ? 'max-h-[80vh]' : 'max-h-[52px]',
        )}
      >
        {/* Header - sempre visivel */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={cn(
            'flex items-center justify-between gap-4',
            'cursor-move select-none',
            'px-3 py-2',
            widthExpanded && 'border-b border-neutral-800',
          )}
        >
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={toggle}
            aria-label={desiredOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={heightExpanded}
            className={cn(
              'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
              'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
              isTransitioning && 'opacity-60 pointer-events-none',
            )}
          >
            {desiredOpen ? 'Fechar' : 'Abrir'}
          </button>
          <div className="text-xs tracking-widest text-neutral-400 uppercase">
            Dev Menu
          </div>
        </div>

        {/* Content - animado via CSS */}
        <div
          className={cn(
            'transition-opacity ease-out',
            'min-h-0 flex-1',
            heightExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          style={{ transitionDuration: `${ANIM_DURATION}ms` }}
        >
          <div className="flex flex-col gap-3">
            <ScrollArea className="flex h-[500px] shadow-inner! shadow-black">
              {children}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
