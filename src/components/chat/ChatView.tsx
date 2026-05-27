import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { sendChatMessage } from '../../services/chat';
import { useFarm } from '../../context/FarmContext';

const SUGGESTIONS = [
  'How much feed should I order for next month?',
  'Give me a farm health report',
  'Any tips for increasing egg production?',
  'Should I sell my eggs or hatch more ducks?',
];

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-homestead-green text-homestead-beige rounded-br-md'
            : 'bg-white border border-homestead-green/20 text-homestead-green rounded-bl-md shadow-sm'
        }`}
      >
        {!isUser && (
          <span className="text-xs font-bold text-homestead-terracotta block mb-1">
            🦆 QuackKeep AI
          </span>
        )}
        <p className="whitespace-pre-wrap">{msg.text}</p>
        <span
          className={`text-[10px] mt-1 block opacity-60 ${
            isUser ? 'text-homestead-beige/70 text-right' : 'text-homestead-green/60'
          }`}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function ChatView() {
  const { refreshFarm } = useFarm();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Welcome to QuackKeep AI! I'm your duck farming assistant. Ask me anything about managing your flock, feed, finances, or farm operations.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(trimmed);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: res.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.farmChanged) {
        refreshFarm();
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `⚠️ Sorry, I couldn't reach the AI assistant. ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <section className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Suggestion chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            disabled={loading}
            className="shrink-0 text-xs font-semibold bg-white border border-homestead-green/30 text-homestead-green rounded-full px-3 py-1.5 hover:bg-homestead-green hover:text-homestead-beige transition-colors disabled:opacity-50 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-1 pr-1 scroll-smooth"
        role="log"
        aria-label="Chat messages"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-homestead-green/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-homestead-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-homestead-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-2 h-2 bg-homestead-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your farm..."
          disabled={loading}
          className="flex-1 bg-white border-2 border-homestead-green/30 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-homestead-green/40 focus:outline-none focus:border-homestead-green disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-12 h-12 bg-homestead-terracotta text-white rounded-xl flex items-center justify-center text-xl font-black hover:bg-homestead-terracotta/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </section>
  );
}
