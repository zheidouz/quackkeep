import { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import TransactionItem from './TransactionItem';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Sales', label: 'Sales' },
  { id: 'Labor', label: 'Labor' },
  { id: 'Vitamins & Medicine', label: 'Vitamins & Meds' },
  { id: 'Transport Costs', label: 'Transport' },
  { id: 'Misc Expenses', label: 'Misc' },
] as const;

export default function LedgerView() {
  const { state, deleteTransaction } = useFarm();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = state.transactions.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.category === activeFilter;
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this financial log entry permanently? Your stock balances won't reverse automatically.")) {
      deleteTransaction(id);
      showToast('Entry deleted.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Historical Ledger</h2>
        <span className="text-xs bg-homestead-green text-homestead-beige px-2 py-1 rounded">
          {filtered.length} entries
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar py-2 -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border border-homestead-green shrink-0 ${
              activeFilter === f.id
                ? 'bg-homestead-green text-white'
                : 'text-homestead-green bg-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-homestead-green/60">
            No transactions match this filter category.
          </div>
        ) : (
          filtered.map((t) => (
            <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
          ))
        )}
      </div>
    </section>
  );
}
