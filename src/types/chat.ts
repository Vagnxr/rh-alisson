export type ChatMessageKind = 'user' | 'system';

export interface ChatAuthor {
  id: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  createdAt: number;
  kind: ChatMessageKind;
  author?: ChatAuthor;
  text: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  unreadCount: number;
}
