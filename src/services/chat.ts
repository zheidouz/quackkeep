const API_BASE = '/_/backend/api/chat';

export async function sendChatMessage(message: string): Promise<string> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Chat API returned ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}
