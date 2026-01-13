import { ClockAlert, LogOut, MessageSquare, ShoppingCart, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlowButton, GlowButtonIcon, GlowButtonText, GlowButtonTitle, GlowButtonSubtitle } from './glow-button';

type ActionDockButtonConfig = {
  disabled?: boolean;
  onClick?: () => void;
};

type ActionDockToggleConfig = {
  disabled?: boolean;
  pressed?: boolean;
  onPress?: () => void;
  timeLeft?: number;
  startIn?: number;
};

export interface ActionDockProps {
  chat?: ActionDockButtonConfig;
  shop?: ActionDockButtonConfig;
  loadout?: ActionDockToggleConfig;
  ready?: ActionDockToggleConfig;
  leave?: ActionDockButtonConfig;
  className?: string;
  layout?: 'row' | 'stack';
}

function formatTwoDigits(value?: number) {
  if (typeof value !== 'number') return '--';
  return value < 10 ? `0${value}` : String(value);
}

export function ActionDock({
  chat,
  shop,
  loadout,
  ready,
  leave,
  className = '',
  layout = 'row',
}: ActionDockProps) {
  const isStack = layout === 'stack';
  const stackRows = (() => {
    if (!isStack) return '';
    const count =
      Number(!!loadout?.onPress) +
      Number(!!ready?.onPress) +
      Number(!!shop?.onClick) +
      Number(!!chat?.onClick) +
      Number(!!leave?.onClick);
    if (count <= 1) return 'grid-rows-1';
    if (count === 2) return 'grid-rows-2';
    return 'grid-rows-3';
  })();

  // se não houver nenhuma ação, não renderizar o ActionDock
  if (!chat?.onClick && !shop?.onClick && !loadout?.onPress && !ready?.onPress && !leave?.onClick) return null;

  return (
    <div
      className={cn(
        isStack ? cn('grid h-full items-stretch px-2 md:px-0 gap-2 md:gap-4', stackRows) : 'flex gap-2',
        className,
      )}
    >

      {leave?.onClick ? (
        <GlowButton
          title="LEAVE MATCH"
          icon={<LogOut />}
          color="red"
          size="xs"
          disabled={!!leave.disabled}
          onClick={leave.onClick}
          fullWidth
          textAlign="center"
        />
      ) : null}

      {shop?.onClick ? (
        <GlowButton
          title="SHOP"
          icon={<ShoppingCart />}
          color="purple"
          size="xs"
          disabled={!!shop.disabled}
          onClick={shop.onClick}
          fullWidth
          textAlign="center"
        />
      ) : null}

      {chat?.onClick ? (
        <GlowButton
          title="CHAT"
          icon={<MessageSquare />}
          color="purple"
          size="xs"
          disabled={!!chat.disabled}
          onClick={chat.onClick}
          fullWidth
          textAlign="center"
        />
      ) : null}

      {loadout?.onPress
        ? (() => {
          const pressed = !!loadout.pressed;
          const timeLeft = loadout.timeLeft;
          const startIn = loadout.startIn ?? 0;
          const hasTimeLeft = typeof timeLeft === 'number' && timeLeft > 0;
          const isStarting = pressed && !hasTimeLeft && startIn > 0;
          const hasStarted = pressed && !hasTimeLeft && startIn <= 0;

          return (
            <GlowButton
              color={pressed ? 'red' : 'green'}
              size="xs"
              pressed={pressed}
              disabled={!!loadout.disabled}
              onClick={loadout.onPress}
              fullWidth
              textAlign="center"
            >
              {!hasTimeLeft && <GlowButtonIcon><ClockAlert /></GlowButtonIcon>}
              <GlowButtonText>
                <GlowButtonTitle>
                  {hasTimeLeft && `(${formatTwoDigits(timeLeft)}) `}
                  {hasStarted
                    ? 'GAME STARTED!'
                    : isStarting
                      ? 'STARTING IN'
                      : pressed
                        ? 'CANCEL LOADOUT'
                        : hasTimeLeft
                          ? 'CONFIRM LOADOUT'
                          : "TIME'S UP!"}
                </GlowButtonTitle>
                {isStarting && (
                  <GlowButtonSubtitle>{formatTwoDigits(startIn)} SECONDS...</GlowButtonSubtitle>
                )}
              </GlowButtonText>
            </GlowButton>
          );
        })()
        : null}

      {ready?.onPress ? (
        <GlowButton
          color={ready.pressed ? 'neutral' : 'green'}
          size="xs"
          pressed={!!ready.pressed}
          disabled={!!ready.disabled}
          onClick={ready.onPress}
          fullWidth
          textAlign="center"
        >
          <GlowButtonIcon>
            <ThumbsUp />
          </GlowButtonIcon>
          <GlowButtonText>
            <GlowButtonTitle>{ready.pressed ? 'NOT READY' : 'READY UP'}</GlowButtonTitle>
          </GlowButtonText>
        </GlowButton>
      ) : null}
    </div>
  );
}
