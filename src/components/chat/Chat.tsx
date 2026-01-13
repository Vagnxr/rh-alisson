import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import type { ChatAuthor } from '@/types/chat';
import { ChatDock } from '@/components/chat/ChatDock';
import { ChatInline } from '@/components/chat/ChatInline';

type ChatMode = 'dock' | 'inline';

export interface ChatProps {
  mode: ChatMode;
  threadId?: string;
  className?: string;
  currentUser?: ChatAuthor;
  placeholder?: string;
  /**
   * Classe(s) Tailwind para tamanho do texto do chat (mensagens + input).
   * Ex.: "text-xs md:text-sm", "text-sm", "text-base".
   */
  textClass?: string;
  displayTime?: boolean;
  displayAuthor?: boolean;
}

export function Chat({
  mode,
  threadId = 'global',
  className = '',
  currentUser,
  placeholder,
  textClass,
  displayTime = true,
  displayAuthor = true,
}: ChatProps) {
  const ensureThread = useChatStore(state => state.ensureThread);
  const threadTitle = useChatStore(state => state.threads[threadId]?.title);

  useEffect(() => {
    ensureThread(threadId, threadTitle ?? threadId.toUpperCase());
  }, [ensureThread, threadId, threadTitle]);

  if (mode === 'inline') {
    return (
      <ChatInline
        threadId={threadId}
        className={className}
        currentUser={currentUser}
        placeholder={placeholder}
        textClass={textClass}
        displayTime={displayTime}
        displayAuthor={displayAuthor}
      />
    );
  }

  return (
    <ChatDock threadId={threadId} currentUser={currentUser} placeholder={placeholder} textClass={textClass} displayTime={displayTime} displayAuthor={displayAuthor} />
  );
}
