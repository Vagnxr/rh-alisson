export type SystemMessageChannel = 'global' | 'lobby' | 'draft' | 'match' | string;

export interface SystemMessageEventDetail {
  channel: SystemMessageChannel;
  text: string;
}

const systemMessageTarget = new EventTarget();

export function onSystemMessage(handler: (detail: SystemMessageEventDetail) => void) {
  const listener: EventListener = event => {
    handler((event as CustomEvent<SystemMessageEventDetail>).detail);
  };
  systemMessageTarget.addEventListener('system:message', listener);
  return () => systemMessageTarget.removeEventListener('system:message', listener);
}

export function emitSystemMessage(channel: SystemMessageChannel, text: string) {
  systemMessageTarget.dispatchEvent(
    new CustomEvent<SystemMessageEventDetail>('system:message', { detail: { channel, text } }),
  );
}

export function postSystemMessage(channel: SystemMessageChannel, text: string) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => emitSystemMessage(channel, text));
    return;
  }
  Promise.resolve().then(() => emitSystemMessage(channel, text));
}
