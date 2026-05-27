import type { ViewId } from '../../types';

interface BottomNavProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onOpenModal: () => void;
}

const tabs: { id: ViewId; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Farm' },
  { id: 'ledger', icon: '📋', label: 'Ledger' },
];

function NavButton({ tab, active, onClick }: { tab: typeof tabs[number]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-0.5 w-16 h-12 rounded-lg focus:outline-none transition-all ${
        active ? 'text-homestead-terracotta' : 'text-homestead-beige/70 hover:text-homestead-beige'
      }`}
      aria-label={`Open ${tab.label}`}
    >
      <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
      <span className="text-[9px] font-black tracking-wide uppercase">{tab.label}</span>
    </button>
  );
}

export default function BottomNav({ activeView, onNavigate, onOpenModal }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-homestead-green text-homestead-beige shadow-2xl z-30">
      <div className="relative flex items-center justify-between px-4 py-1.5">
        {/* Left: Farm */}
        <div className="flex items-center gap-1">
          <NavButton
            tab={tabs[0]}
            active={activeView === tabs[0].id}
            onClick={() => onNavigate(tabs[0].id)}
          />
        </div>

        {/* FAB — absolutely centered above */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7">
          <button
            onClick={onOpenModal}
            className="w-16 h-16 bg-homestead-terracotta text-white rounded-full border-4 border-homestead-beige flex items-center justify-center font-black text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none"
            aria-label="Add Daily Activity Event"
          >
            ➕
          </button>
        </div>

        {/* Right: Ledger */}
        <div className="flex items-center gap-1">
          <NavButton
            tab={tabs[1]}
            active={activeView === tabs[1].id}
            onClick={() => onNavigate(tabs[1].id)}
          />
        </div>
      </div>
    </nav>
  );
}
