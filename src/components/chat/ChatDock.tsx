import { useMemo } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useChatStore } from '@/stores/chatStore';
import type { ChatAuthor } from '@/types/chat';
import { ChatPanel } from '@/components/chat/ChatPanel';

interface ChatDockProps {
  threadId?: string;
  currentUser?: ChatAuthor;
  placeholder?: string;
  textClass?: string;
  displayTime?: boolean;
  displayAuthor?: boolean;
}

export function ChatDock({ threadId = 'global', currentUser, placeholder, textClass, displayTime = true, displayAuthor = true }: ChatDockProps) {
  const dockEnabled = useChatStore(state => state.dockEnabled);
  const isOpen = useChatStore(state => state.isOpen);
  const activeThreadId = useChatStore(state => state.activeThreadId);
  const threads = useChatStore(state => state.threads);
  const open = useChatStore(state => state.open);
  const close = useChatStore(state => state.close);
  const setActiveThread = useChatStore(state => state.setActiveThread);
  const markRead = useChatStore(state => state.markRead);

  const unreadTotal = useMemo(() => {
    return Object.values(threads).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);
  }, [threads]);

  const threadOptions = useMemo(() => {
    return Object.values(threads)
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [threads]);

  if (!dockEnabled) return null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => open(threadId)}
        className={cn(
          'fixed right-4 bottom-4 z-50',
          'border-border-muted shadow-pixel bg-panel flex items-center gap-2 rounded-full border-4 px-4 py-2',
          'font-mono text-xs font-black tracking-widest text-neutral-200 uppercase',
          'hover:bg-black/20 active:translate-y-0.5',
        )}
      >
        <MessageSquare className="text-neon-yellow h-4 w-4" />
        CHAT
        {unreadTotal > 0 ? (
          <span className="bg-neon-green text-space-black rounded-full px-2 py-0.5 text-[10px] font-black">
            {unreadTotal}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-15 z-50 md:right-3',
        'w-full md:w-[min(440px,calc(100vw-2rem))]',
        'h-[min(520px,calc(100vh-2rem))]',
      )}
    >
      <div className="border-border-muted shadow-pixel bg-panel flex items-center justify-between gap-2 rounded-t-xl border-4 border-b-0 px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-neon-yellow h-4 w-4" />
          <span className="font-mono text-xs font-black tracking-widest text-neutral-200 uppercase">
            CHAT
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeThreadId}
            onChange={e => {
              const next = e.target.value;
              setActiveThread(next);
              markRead(next);
            }}
            className={cn(
              'border-border-muted bg-black text-neutral-200',
              'rounded border px-2 py-1 font-mono text-xs',
              'focus:ring-0 focus:outline-none',
            )}
          >
            {threadOptions.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-label="Fechar chat"
            onClick={() => close()}
            className={cn(
              'border-border-muted rounded border bg-black p-1 text-neutral-200',
              'hover:bg-black/40 active:translate-y-0.5',
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ChatPanel
        threadId={activeThreadId}
        currentUser={currentUser}
        placeholder={placeholder}
        className="h-full rounded-t-none border-t-0"
        textClass={textClass}
        displayTime={displayTime}
        displayAuthor={displayAuthor}
      />
    </div>
  );
}
