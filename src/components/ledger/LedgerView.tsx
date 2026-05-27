import { useState } from 'react';
import { useFarm } from '../../context/FarmContext';

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(0);

  const filtered = state.transactions.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.category === activeFilter;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const paged = filtered.slice(pageStart, pageStart + PAGE_SIZE);

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
            onClick={() => { setActiveFilter(f.id); setPage(0); }}
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
        {paged.length === 0 ? (
          <div className="text-center py-8 text-xs text-homestead-green/60">
            No transactions match this filter category.
          </div>
        ) : (
          paged.map((t) => {
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-homestead-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-homestead-green hover:text-white transition-all cursor-pointer"
          >
            ← Prev
          </button>
          <span className="text-xs font-bold text-homestead-green">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-homestead-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-homestead-green hover:text-white transition-all cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
