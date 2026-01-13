import type { ReactNode } from 'react';
import { Chat } from '@/components/chat/Chat';
import { PortalBackgroundAnimated } from '@/components/ui/decorations/portal-background-animated';
import { NotificationBar } from '@/components/ui/notification-bar';
import { cn } from '@/lib/cn';

export interface ScreenShellProps {
  /** Screen atual renderizada dentro do “monitor/viewport” */
  children: ReactNode;
  /** Overlay opcional (ex.: Dev tools em DEV) */
  devTools?: ReactNode;
  /** Controla se o background global é exibido */
  showBackground?: boolean;
  /** Controla se o Chat dock global é exibido */
  showChatDock?: boolean;
  /** Controla se a NotificationBar global é exibida */
  showNotifications?: boolean;
  className?: string;
}

/**
 * ScreenShell é o “container/monitor” da aplicação: concentra overlays globais
 * (background, chat dock, notifications, dev tools) e renderiza a Screen atual
 * dentro do viewport.
 *
 * - As Screens continuam em `src/screens/` e devem ser “finas”.
 * - HomeScreen é uma Screen fora das Phases do jogo (LOBBY/DRAFT/MATCH/RESULTS).
 */
export function ScreenShell({
  children,
  devTools,
  showBackground = true,
  showChatDock = true,
  showNotifications = true,
  className,
}: ScreenShellProps) {
  return (
    <>
      {showBackground ? (
        <PortalBackgroundAnimated quality="balanced" gooMotion="off" stars="full" portalScale={0.5} />
      ) : null}

      <div className={cn('relative z-10 min-h-screen', className)}>{children}</div>

      {showChatDock ? <Chat mode="dock" /> : null}
      {showNotifications ? <NotificationBar /> : null}
      {devTools}
    </>
  );
}


