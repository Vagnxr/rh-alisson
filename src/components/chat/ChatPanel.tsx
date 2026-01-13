import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useChatStore } from '@/stores/chatStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatAuthor } from '@/types/chat';
import { ChatMessageRow } from '@/components/chat/ChatMessageRow';

interface ChatPanelProps {
  threadId: string;
  currentUser?: ChatAuthor;
  placeholder?: string;
  className?: string;
  textClass?: string;
  displayTime?: boolean;
  displayAuthor?: boolean;
}

export function ChatPanel({
  threadId,
  currentUser,
  placeholder = 'Digite uma mensagem...',
  className = '',
  textClass = 'text-xs md:text-sm',
  displayTime = true,
  displayAuthor = true,
}: ChatPanelProps) {
  const messages = useChatStore(state => state.threads[threadId]?.messages ?? []);
  const sendMessage = useChatStore(state => state.sendMessage);
  const focusInputNonce = useChatStore(state => state.focusInputNonce);

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [focusInputNonce]);

  const onSubmit = () => {
    const value = text;
    sendMessage({ text: value, author: currentUser, threadId });
    setText('');
  };

  return (
    <div
      className={cn(
        'border-border-muted shadow-pixel relative flex flex-col overflow-hidden rounded border-4 bg-black',
        'font-mono',
        textClass,
        className,
      )}
    >
      <div className={cn('bg-scanlines pointer-events-none absolute inset-0 opacity-20')} />

      <ScrollArea
        className="relative h-full grow"
      >
        <div
          role="log"
          aria-label="Chat"
          aria-live="polite"
          className="space-y-1 p-3"
        >
          {messages.map(message => (
            <ChatMessageRow key={message.id} message={message} displayTime={displayTime} displayAuthor={displayAuthor} />
          ))}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <form
        className="relative flex items-center gap-2 border-t border-neutral-800 px-3 py-2"
        onSubmit={event => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <span className="animate-pulse text-neutral-400">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'text-neon-green w-full border-none bg-transparent font-mono placeholder-neutral-700',
            'focus:ring-0 focus:outline-none',
          )}
        />
        <button
          type="submit"
          className={cn(
            'border-border-muted bg-panel text-text-primary rounded border px-3 py-1 uppercase',
            'hover:bg-black/20 active:translate-y-0.5',
          )}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
