import type { ChatMessage } from '@/types/chat';
import { formatChatTime } from '@/components/chat/chatFormat';

interface ChatMessageRowProps {
  message: ChatMessage;
  displayTime?: boolean;
  displayAuthor?: boolean;
}

export function ChatMessageRow({ message, displayTime = true, displayAuthor = true }: ChatMessageRowProps) {
  if (message.kind === 'system') {
    return (
      <div className="opacity-80">
        {displayTime ? <span className="text-neutral-500">[{formatChatTime(message.createdAt)}]</span> : null}{' '}
        {displayAuthor ? <span className="font-normal text-neutral-400">SISTEMA:</span> : null}{' '}
        <span className="text-neutral-300">{message.text}</span>
      </div>
    );
  }

  const authorName = message.author?.name ?? 'PLAYER';
  return (
    <div className="opacity-90">
      {displayTime ? <span className="text-neutral-500">[{formatChatTime(message.createdAt)}]</span> : null}{' '}
      {displayAuthor ? <span className="font-normal text-neutral-300">{authorName.toUpperCase()}:</span> : null}{' '}
      <span className="text-neon-green wrap-break-word">{message.text}</span>
    </div>
  );
}
