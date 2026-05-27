import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { ViewId } from './types';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import DashboardView from './components/dashboard/DashboardView';
import LedgerView from './components/ledger/LedgerView';
import LogModal from './components/modal/LogModal';
import AdminPage from './components/admin/AdminPage';
import ErrorBoundary from './components/layout/ErrorBoundary';
import ChatHead from './components/chat/ChatHead';

function MainLayout() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'ledger':
        return <LedgerView />;
    }
  };

  return (
    <div className="font-sans text-homestead-green bg-homestead-beige min-h-screen flex flex-col selection:bg-homestead-terracotta selection:text-white">
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
        onNavigate={setActiveView}
        onOpenModal={() => setModalOpen(true)}
      />

      <LogModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ChatHead />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
