import { useState } from 'react';
import { useFarm } from '../../context/FarmContext';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Sales', label: 'Sales' },
  { id: 'Labor', label: 'Labor' },
  { id: 'Vitamins & Medicine', label: 'Vitamins & Meds' },
  { id: 'Transport Costs', label: 'Transport' },
  { id: 'Misc Expenses', label: 'Misc' },
] as const;

export default function LedgerView() {
  const { state } = useFarm();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = state.transactions.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.category === activeFilter;
  });

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
          filtered.map((t) => {
            const formattedDate = new Date(t.date).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            const isRev = t.type === 'revenue';
            return (
              <article key={t.id} className="bg-white p-3.5 rounded-xl border border-homestead-green shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${
                        isRev ? 'bg-homestead-light-green text-homestead-green' : 'bg-homestead-beige border border-homestead-green/30'
                      }`}>
                        {t.category}
                      </span>
                      <span className="text-[10px] text-homestead-green/60 font-semibold">{formattedDate}</span>
                    </div>
                    <p className="text-sm font-bold text-homestead-green">{t.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-black ${isRev ? 'text-green-700' : 'text-homestead-terracotta'}`}>
                      {isRev ? '+' : '-'}₱{t.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
