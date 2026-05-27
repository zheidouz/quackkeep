import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RecalibrateView from '../recalibrate/RecalibrateView';
import AdminLedger from './AdminLedger';
import PinModal from '../modal/PinModal';

type AdminTab = 'calibrate' | 'ledger';

const TABS: { id: AdminTab; icon: string; label: string }[] = [
  { id: 'calibrate', icon: '⚙️', label: 'Calibrate' },
  { id: 'ledger', icon: '📋', label: 'Manage Ledger' },
];

export default function AdminPage() {
  const [pinVerified, setPinVerified] = useState(false);
  const [pinOpen, setPinOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('calibrate');
  const navigate = useNavigate();

  const handleSuccess = useCallback(() => {
    setPinVerified(true);
    setPinOpen(false);
  }, []);

  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-homestead-beige flex flex-col">
        <header className="bg-homestead-green text-homestead-beige px-4 py-3 shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight">🔒 Admin Panel</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs bg-homestead-terracotta px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 cursor-pointer"
          >
            ← Back to Farm
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-homestead-green/60 text-sm">Enter your PIN to access admin settings</p>
          </div>
        </main>
        <PinModal
          open={pinOpen}
          mode="unlock"
          onSuccess={handleSuccess}
          onClose={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-homestead-beige flex flex-col">
      <header className="bg-homestead-green text-homestead-beige px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold tracking-tight">⚙️ Admin Panel</h1>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-xs bg-homestead-terracotta px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 cursor-pointer"
        >
          ← Back to Farm
        </button>
      </header>

      {/* Sub-navigation tabs */}
      <nav className="bg-white border-b border-homestead-green/20 px-4 py-2 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-homestead-green text-white shadow-md'
                : 'text-homestead-green/60 hover:text-homestead-green hover:bg-homestead-green/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-lg w-full mx-auto p-4 pb-8">
        {activeTab === 'calibrate' && <RecalibrateView />}
        {activeTab === 'ledger' && (
          <article className="bg-white rounded-2xl p-5 border-2 border-homestead-green shadow-[4px_4px_0px_0px_rgba(26,58,43,1)]">
            <AdminLedger />
          </article>
        )}
      </main>
    </div>
  );
}
