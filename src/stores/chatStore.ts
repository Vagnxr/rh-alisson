import { create } from 'zustand';
import type { ChatAuthor, ChatMessage, ChatThread } from '@/types/chat';

type ChatEventName =
  | 'chat:ui:open'
  | 'chat:ui:close'
  | 'chat:thread:change'
  | 'chat:message:add'
  | 'chat:message:send';

type ChatEventDetailMap = {
  'chat:ui:open': { threadId: string };
  'chat:ui:close': { threadId: string };
  'chat:thread:change': { threadId: string };
  'chat:message:add': { message: ChatMessage };
  'chat:message:send': { message: ChatMessage };
};

const chatEventTarget = new EventTarget();

export const chatEvents = {
  on<K extends ChatEventName>(
    name: K,
    handler: (detail: ChatEventDetailMap[K]) => void,
  ): () => void {
    const listener: EventListener = event => {
      handler((event as CustomEvent<ChatEventDetailMap[K]>).detail);
    };
    chatEventTarget.addEventListener(name, listener);
    return () => chatEventTarget.removeEventListener(name, listener);
  },
  emit<K extends ChatEventName>(name: K, detail: ChatEventDetailMap[K]) {
    chatEventTarget.dispatchEvent(new CustomEvent(name, { detail }));
  },
};

function makeId(prefix: string) {
  const safeCrypto = typeof crypto !== 'undefined' ? crypto : undefined;
  const random = safeCrypto?.randomUUID?.();
  if (random) return `${prefix}_${random}`;
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function getDefaultThreads(): Record<string, ChatThread> {
  const now = Date.now();
  const makeThread = (id: string, title: string): ChatThread => ({
    id,
    title,
    messages: [
      {
        id: makeId('msg'),
        threadId: id,
        createdAt: now,
        kind: 'system',
        text: `Sistema: canal "${title}" inicializado.`,
      },
    ],
    unreadCount: 0,
  });

  return {
    global: makeThread('global', 'GLOBAL'),
    lobby: makeThread('lobby', 'LOBBY'),
    draft: makeThread('draft', 'DRAFT'),
    match: makeThread('match', 'MATCH'),
  };
}

interface ChatStore {
  isOpen: boolean;
  activeThreadId: string;
  threads: Record<string, ChatThread>;
  dockEnabled: boolean;
  inlineHostCount: number;
  focusInputNonce: number;

  ensureThread: (threadId: string, title?: string) => void;
  createThread: (threadId: string, title: string) => void;
  setActiveThread: (threadId: string) => void;

  open: (threadId?: string) => void;
  close: () => void;
  toggle: (threadId?: string) => void;
  requestFocusInput: () => void;

  registerInlineHost: () => () => void;

  addSystemMessage: (text: string, threadId?: string) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (params: { text: string; author?: ChatAuthor; threadId?: string }) => void;
  clearThread: (threadId?: string) => void;
  markRead: (threadId?: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isOpen: false,
  activeThreadId: 'global',
  threads: getDefaultThreads(),
  dockEnabled: true,
  inlineHostCount: 0,
  focusInputNonce: 0,

  ensureThread: (threadId, title) => {
    set(state => {
      if (state.threads[threadId]) return state;
      const created: ChatThread = {
        id: threadId,
        title: title ?? threadId,
        messages: [],
        unreadCount: 0,
      };
      return { ...state, threads: { ...state.threads, [threadId]: created } };
    });
  },

  createThread: (threadId, title) => {
    set(state => {
      const created: ChatThread = { id: threadId, title, messages: [], unreadCount: 0 };
      return { ...state, threads: { ...state.threads, [threadId]: created } };
    });
  },

  setActiveThread: threadId => {
    get().ensureThread(threadId);
    set({ activeThreadId: threadId });
    chatEvents.emit('chat:thread:change', { threadId });
  },

  open: (threadId = get().activeThreadId) => {
    get().ensureThread(threadId);
    set({ isOpen: true, activeThreadId: threadId });
    chatEvents.emit('chat:ui:open', { threadId });
    get().requestFocusInput();
  },

  close: () => {
    const threadId = get().activeThreadId;
    set({ isOpen: false });
    chatEvents.emit('chat:ui:close', { threadId });
  },

  toggle: (threadId = get().activeThreadId) => {
    if (get().isOpen) get().close();
    else get().open(threadId);
  },

  requestFocusInput: () => {
    set(state => ({ focusInputNonce: state.focusInputNonce + 1 }));
  },

  registerInlineHost: () => {
    set(state => ({ inlineHostCount: state.inlineHostCount + 1, dockEnabled: false }));
    return () => {
      set(state => {
        const next = Math.max(0, state.inlineHostCount - 1);
        return { inlineHostCount: next, dockEnabled: next === 0 };
      });
    };
  },

  addSystemMessage: (text, threadId = get().activeThreadId) => {
    const clean = normalizeText(text);
    if (!clean) return;
    const message: ChatMessage = {
      id: makeId('msg'),
      threadId,
      createdAt: Date.now(),
      kind: 'system',
      text: clean,
    };
    get().addMessage(message);
  },

  addMessage: message => {
    set(state => {
      const thread = state.threads[message.threadId] ?? {
        id: message.threadId,
        title: message.threadId,
        messages: [],
        unreadCount: 0,
      };
      const isActive = state.activeThreadId === message.threadId;
      const nextThread: ChatThread = {
        ...thread,
        messages: [...thread.messages, message],
        unreadCount: isActive && state.isOpen ? 0 : thread.unreadCount + 1,
      };
      return { ...state, threads: { ...state.threads, [message.threadId]: nextThread } };
    });
    chatEvents.emit('chat:message:add', { message });
  },

  sendMessage: ({ text, author, threadId = get().activeThreadId }) => {
    const clean = normalizeText(text);
    if (!clean) return;

    const message: ChatMessage = {
      id: makeId('msg'),
      threadId,
      createdAt: Date.now(),
      kind: 'user',
      author,
      text: clean,
    };

    get().addMessage(message);
    chatEvents.emit('chat:message:send', { message });
  },

  clearThread: (threadId = get().activeThreadId) => {
    set(state => {
      const thread = state.threads[threadId];
      if (!thread) return state;
      return {
        ...state,
        threads: { ...state.threads, [threadId]: { ...thread, messages: [], unreadCount: 0 } },
      };
    });
  },

  markRead: (threadId = get().activeThreadId) => {
    set(state => {
      const thread = state.threads[threadId];
      if (!thread) return state;
      return { ...state, threads: { ...state.threads, [threadId]: { ...thread, unreadCount: 0 } } };
    });
  },
}));

export const chatActions = {
  open(threadId?: string) {
    useChatStore.getState().open(threadId);
  },
  close() {
    useChatStore.getState().close();
  },
  toggle(threadId?: string) {
    useChatStore.getState().toggle(threadId);
  },
  addSystemMessage(text: string, threadId?: string) {
    useChatStore.getState().addSystemMessage(text, threadId);
  },
  sendMessage(params: { text: string; author?: ChatAuthor; threadId?: string }) {
    useChatStore.getState().sendMessage(params);
  },
  setActiveThread(threadId: string) {
    useChatStore.getState().setActiveThread(threadId);
  },
};
