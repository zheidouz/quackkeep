import { useToast } from '../../context/ToastContext';

export default function Header() {
  const { message } = useToast();

  return (
    <header className="sticky top-0 bg-homestead-green text-homestead-beige border-b border-homestead-green px-4 py-3 shadow-md flex items-center justify-between z-40">
      <div className="flex items-center space-x-2">
        <svg className="w-8 h-8 fill-current text-homestead-terracotta" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a4 4 0 0 1 4 4c0 .82-.25 1.58-.68 2.21l1.39.8c.83-.54 1.81-.86 2.87-.86.42 0 .82.05 1.21.14l-.39.78a3.99 3.99 0 0 1-3.41 2.21c-1.25 0-2.37-.57-3.12-1.46L14.62 11c.24.31.38.7.38 1.12 0 1-.81 1.81-1.81 1.81-.31 0-.6-.08-.85-.22l-.76 1.51c.97.52 1.61 1.54 1.61 2.71 0 1.7-1.39 3.09-3.09 3.09S7.01 19.63 7.01 17.93c0-1.07.54-2 1.36-2.56l-.85-1.71A3.076 3.076 0 0 1 6.01 13.9c-1.7 0-3.09-1.39-3.09-3.09s1.39-3.09 3.09-3.09c.85 0 1.62.35 2.18.91l1.19-.69A3.953 3.953 0 0 1 8 6a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2c0 .48.17.92.45 1.27l1.09-.63c.27-.15.6-.11.82.1l1.19 1.19a1 1 0 0 1-1.41 1.41l-1.07-1.07L9.9 8.91c-.56-.37-.9-.99-.9-1.69a2 2 0 0 0 2-2h1z" />
        </svg>
        <h1 className="text-xl font-bold tracking-tight">QuackKeep</h1>
      </div>
      <div
        role="status"
        aria-live="polite"
        className={`text-sm bg-homestead-terracotta text-white px-3 py-1 rounded-md border border-white max-w-[200px] truncate transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0'}`}
      >
        {message || 'Ready'}
      </div>
    </header>
  );
}
