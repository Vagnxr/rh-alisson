import { onSystemMessage } from '@/lib/systemMessages';
import { useChatStore } from '@/stores/chatStore';

let didInit = false;
let unsubscribe: null | (() => void) = null;

export function initChatSystemBridge() {
  if (didInit) return;
  didInit = true;

  unsubscribe = onSystemMessage(({ channel, text }) => {
    useChatStore.getState().addSystemMessage(text, channel);
  });
}

export function teardownChatSystemBridge() {
  unsubscribe?.();
  unsubscribe = null;
  didInit = false;
}
