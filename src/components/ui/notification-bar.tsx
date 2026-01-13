import { useEffect, useState } from 'react';
import { useNotificationStore, type Notification, type NotificationVariant } from '@/stores/notificationStore';
import { cn } from '@/lib/cn';
import { AlertTriangle, Info, CheckCircle, XCircle, X, Bug } from 'lucide-react';

interface VariantStyle {
  container: string;
  text: string;
  icon: typeof AlertTriangle;
}

const variantStyles: Record<NotificationVariant, VariantStyle> = {
  important: {
    container: 'bg-neon-red-dark/95 border-neon-red shadow-[0_-5px_20px_var(--color-neon-red-glow)]',
    text: 'text-red-100',
    icon: XCircle,
  },
  warning: {
    container: 'bg-neon-yellow-dark/95 border-neon-yellow shadow-[0_-5px_20px_rgba(250,204,21,0.4)]',
    text: 'text-yellow-100',
    icon: AlertTriangle,
  },
  success: {
    container: 'bg-neon-green-dark/95 border-neon-green shadow-[0_-5px_20px_var(--color-neon-green-glow)]',
    text: 'text-green-100',
    icon: CheckCircle,
  },
  info: {
    container: 'bg-neon-cyan-dark/95 border-neon-cyan shadow-[0_-5px_20px_var(--color-neon-cyan-glow)]',
    text: 'text-cyan-100',
    icon: Info,
  },
  debug: {
    container: 'bg-neon-purple-dark/95 border-neon-purple shadow-[0_-5px_20px_var(--color-neon-purple-glow)]',
    text: 'text-purple-100',
    icon: Bug,
  },
};

const EXIT_DURATION = 300; // ms

export function NotificationBar() {
  const current = useNotificationStore(state => state.current);
  const dismiss = useNotificationStore(state => state.dismiss);

  const [visible, setVisible] = useState<Notification | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (current && !visible) {
      // Nova notificacao chegou
      setVisible(current);
      setIsExiting(false);
    } else if (current && visible && current.id !== visible.id) {
      // Notificacao mudou - animar saida da antiga, depois mostrar nova
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setVisible(current);
        setIsExiting(false);
      }, EXIT_DURATION);
      return () => clearTimeout(timeout);
    } else if (!current && visible) {
      // Notificacao removida - animar saida
      setIsExiting(true);
      const timeout = setTimeout(() => {
        setVisible(null);
        setIsExiting(false);
      }, EXIT_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [current, visible]);

  if (!visible) return null;

  const style = variantStyles[visible.variant];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 w-full border-t-4 p-2 z-50',
        isExiting
          ? 'animate-out slide-out-to-bottom duration-300'
          : 'animate-in slide-in-from-bottom duration-300',
        style.container,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
        <Icon className={cn('h-5 w-5 shrink-0', style.text)} />
        <span
          className={cn(
            'font-pixel text-sm lg:text-base uppercase tracking-wider',
            style.text,
          )}
        >
          {visible.message}
        </span>
        {visible.durationTime === 0 && (
          <button
            onClick={() => dismiss(visible.id)}
            className={cn('p-1 hover:bg-white/10 rounded', style.text)}
            aria-label="Fechar notificacao"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
