export function formatChatTime(createdAt: number) {
  try {
    const date = new Date(createdAt);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}
