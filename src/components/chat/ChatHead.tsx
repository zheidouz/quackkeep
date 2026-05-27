import { useState, useRef, useEffect, useCallback } from 'react';
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-homestead-green text-homestead-beige rounded-br-md'
            : 'bg-white border border-homestead-green/20 text-homestead-green rounded-bl-md shadow-sm'
        }`}
      >
        {!isUser && (
          <span className="text-[10px] font-bold text-homestead-terracotta block mb-0.5">
            🦆 QuackKeep AI
          </span>
        )}
        <p className="whitespace-pre-wrap">{msg.text}</p>
        <span
          className={`text-[9px] mt-0.5 block opacity-60 ${
            isUser ? 'text-homestead-beige/70 text-right' : 'text-homestead-green/60'
          }`}
        >
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function ChatHead() {
  const { refreshFarm } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Close when clicking outside panel
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
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
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: `⚠️ Sorry, I couldn't reach the AI assistant. ${err instanceof Error ? err.message : 'Please try again.'}`,
          timestamp: Date.now(),
        },
      ]);
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
    <>
      {/* Chathead button — floating above the bottom nav */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-homestead-green text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all border-2 border-homestead-beige cursor-pointer"
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        {isOpen ? '✕' : '🦆'}
      </button>

      {/* Backdrop (visible only when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={handleBackdrop}
          aria-hidden="true"
        />
      )}

      {/* Chat panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-36 right-4 z-50 w-[calc(100%-2rem)] max-w-sm bg-homestead-beige rounded-2xl border-2 border-homestead-green shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: 'min(60vh, 32rem)' }}
        role="dialog"
        aria-label="AI Chat"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-homestead-green/20 bg-homestead-green text-homestead-beige rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦆</span>
            <div>
              <span className="text-sm font-bold">QuackKeep AI</span>
              <span className="text-[10px] block opacity-70">Ask anything about your farm</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-homestead-beige/20 hover:bg-homestead-beige/40 text-sm transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-3 py-2 border-b border-homestead-green/10">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="shrink-0 text-[10px] font-semibold bg-white border border-homestead-green/30 text-homestead-green rounded-full px-2.5 py-1 hover:bg-homestead-green hover:text-homestead-beige transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scroll-smooth"
          role="log"
          aria-label="Chat messages"
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="flex justify-start mb-2">
              <div className="bg-white border border-homestead-green/20 rounded-2xl rounded-bl-md px-3 py-2 shadow-sm">
                <div className="flex space-x-1.5">
                  <span className="w-1.5 h-1.5 bg-homestead-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1.5 h-1.5 bg-homestead-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 bg-homestead-terracotta/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 border-t border-homestead-green/10 bg-homestead-beige rounded-b-2xl">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your farm..."
            disabled={loading}
            className="flex-1 bg-white border-2 border-homestead-green/30 rounded-xl px-3 py-2 text-sm font-medium placeholder:text-homestead-green/40 focus:outline-none focus:border-homestead-green disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-homestead-terracotta text-white rounded-xl flex items-center justify-center text-lg font-black hover:bg-homestead-terracotta/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </div>
    </>
  );
}
