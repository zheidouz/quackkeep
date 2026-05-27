import { useState, useCallback } from 'react';
import type { ViewId } from './types';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import DashboardView from './components/dashboard/DashboardView';
import LedgerView from './components/ledger/LedgerView';
import RecalibrateView from './components/recalibrate/RecalibrateView';
import ChatView from './components/chat/ChatView';
import LogModal from './components/modal/LogModal';
import PinModal from './components/modal/PinModal';

function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingView, setPendingView] = useState<ViewId | null>(null);

  const handleNavigate = useCallback((view: ViewId) => {
    if (view === 'recalibrate') {
      setPendingView(view);
      setPinModalOpen(true);
    } else {
      setActiveView(view);
    }
  }, []);

  const handlePinSuccess = useCallback(() => {
    setPinModalOpen(false);
    if (pendingView) {
      setActiveView(pendingView);
      setPendingView(null);
    }
  }, [pendingView]);

  const handlePinClose = useCallback(() => {
    setPinModalOpen(false);
    setPendingView(null);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'ledger':
        return <LedgerView />;
      case 'recalibrate':
        return <RecalibrateView />;
      case 'chat':
        return <ChatView />;
    }
  };

  return (
    <div className="font-sans text-homestead-green bg-homestead-beige min-h-screen flex flex-col selection:bg-homestead-terracotta selection:text-white">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-homestead-terracotta text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      <Header />

      <main
        id="main-content"
        className="flex-1 max-w-lg w-full mx-auto p-4 pb-28 focus:outline-none"
        tabIndex={-1}
      >
        {renderView()}
      </main>

      <BottomNav
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenModal={() => setModalOpen(true)}
      />

      <LogModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <PinModal
        open={pinModalOpen}
        mode="unlock"
        onSuccess={handlePinSuccess}
        onClose={handlePinClose}
      />
    </div>
  );
}

export default App;
