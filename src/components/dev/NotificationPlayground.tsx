import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { NotificationVariant } from '@/stores/notificationStore';

const NOTIFICATION_VARIANTS: NotificationVariant[] = ['important', 'warning', 'success', 'info', 'debug'];

const NOTIFICATION_SAMPLES: Record<NotificationVariant, string> = {
  important: 'SISTEMA OFFLINE! Reconectando...',
  warning: 'Conexao instavel detectada',
  success: 'Partida salva com sucesso!',
  info: 'Nova atualizacao disponivel',
  debug: '[DEBUG] State sync completed',
};

export interface NotificationPlaygroundProps {
  showNotification: (args: { message: string; variant: NotificationVariant; durationTime: number }) => void;
  dismissNotification: () => void;
  clearNotifications: () => void;
}

export function NotificationPlayground({
  showNotification,
  dismissNotification,
  clearNotifications,
}: NotificationPlaygroundProps) {
  const [notifVariant, setNotifVariant] = useState<NotificationVariant>('info');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifDuration, setNotifDuration] = useState(5000);

  const sample = useMemo(() => NOTIFICATION_SAMPLES[notifVariant], [notifVariant]);

  return (
    <div className="rounded border border-neutral-800 bg-black/50 p-3">
      <div className="mb-2 text-xs tracking-widest text-neutral-400 uppercase">Notification</div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <select
            value={notifVariant}
            onChange={e => {
              const v = e.target.value as NotificationVariant;
              setNotifVariant(v);
              setNotifMessage(NOTIFICATION_SAMPLES[v]);
            }}
            className={cn('flex-1 rounded border border-neutral-700 bg-black', 'px-2 py-1 text-xs text-white')}
          >
            {NOTIFICATION_VARIANTS.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={notifDuration}
            onChange={e => setNotifDuration(Number(e.target.value))}
            placeholder="ms"
            className={cn('w-20 rounded border border-neutral-700 bg-black', 'px-2 py-1 text-xs text-white')}
          />
        </div>
        <input
          type="text"
          value={notifMessage}
          onChange={e => setNotifMessage(e.target.value)}
          placeholder="Mensagem..."
          className={cn('w-full rounded border border-neutral-700 bg-black', 'px-2 py-1 text-xs text-white')}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const msg = notifMessage || sample;
              showNotification({ message: msg, variant: notifVariant, durationTime: notifDuration });
            }}
            className={cn(
              'flex-1 rounded border border-neon-green/50 bg-neon-green-dark px-2 py-1',
              'text-xs text-white hover:bg-neon-green/20',
            )}
          >
            Show
          </button>
          <button
            type="button"
            onClick={dismissNotification}
            className={cn(
              'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
              'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
            )}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={clearNotifications}
            className={cn(
              'rounded border border-neutral-700 bg-neutral-900 px-2 py-1',
              'text-xs text-white hover:border-neutral-300 hover:bg-neutral-800',
            )}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
