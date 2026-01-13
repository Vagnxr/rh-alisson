import { create } from 'zustand';

export type NotificationVariant = 'important' | 'warning' | 'success' | 'info' | 'debug';

export interface Notification {
  id: string;
  variant: NotificationVariant;
  message: string;
  durationTime: number; // ms, 0 = persistent
}

export interface ShowNotificationParams {
  message: string;
  variant?: NotificationVariant;
  durationTime?: number;
}

interface NotificationStore {
  current: Notification | null;
  queue: Notification[];

  show: (params: ShowNotificationParams) => string;
  dismiss: (id?: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 5000; // 5 segundos

function makeId() {
  const safeCrypto = typeof crypto !== 'undefined' ? crypto : undefined;
  const random = safeCrypto?.randomUUID?.();
  if (random) return `notif_${random}`;
  return `notif_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  current: null,
  queue: [],

  show: ({ message, variant = 'info', durationTime = DEFAULT_DURATION }) => {
    const id = makeId();
    const notification: Notification = { id, variant, message, durationTime };

    set(state => {
      // Se nao ha notificacao atual, exibe diretamente
      if (!state.current) {
        return { current: notification };
      }
      // Caso contrario, adiciona na fila
      return { queue: [...state.queue, notification] };
    });

    // Auto-dismiss se tiver duracao
    if (durationTime > 0) {
      setTimeout(() => {
        get().dismiss(id);
      }, durationTime);
    }

    return id;
  },

  dismiss: id => {
    set(state => {
      // Se nenhum ID especificado ou o ID corresponde ao atual
      if (!id || state.current?.id === id) {
        const [next, ...rest] = state.queue;
        // Inicia timer para proxima notificacao se existir
        if (next && next.durationTime > 0) {
          setTimeout(() => {
            get().dismiss(next.id);
          }, next.durationTime);
        }
        return { current: next ?? null, queue: rest };
      }
      // Remove da fila se estiver la
      return { queue: state.queue.filter(n => n.id !== id) };
    });
  },

  clear: () => {
    set({ current: null, queue: [] });
  },
}));

// Hook para uso em componentes
export function useNotification() {
  const show = useNotificationStore(state => state.show);
  const dismiss = useNotificationStore(state => state.dismiss);
  const clear = useNotificationStore(state => state.clear);
  const current = useNotificationStore(state => state.current);

  return { show, dismiss, clear, current };
}

// Actions para uso externo (sem hooks)
export const notificationActions = {
  show(params: ShowNotificationParams) {
    return useNotificationStore.getState().show(params);
  },
  dismiss(id?: string) {
    useNotificationStore.getState().dismiss(id);
  },
  clear() {
    useNotificationStore.getState().clear();
  },
  // Helpers semanticos
  important(message: string, durationTime?: number) {
    return this.show({ variant: 'important', message, durationTime });
  },
  warning(message: string, durationTime?: number) {
    return this.show({ variant: 'warning', message, durationTime });
  },
  success(message: string, durationTime?: number) {
    return this.show({ variant: 'success', message, durationTime });
  },
  info(message: string, durationTime?: number) {
    return this.show({ variant: 'info', message, durationTime });
  },
  debug(message: string, durationTime?: number) {
    // Debug so aparece em dev
    if (!import.meta.env.DEV) return '';
    return this.show({ variant: 'debug', message, durationTime });
  },
};
