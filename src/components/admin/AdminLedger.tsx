import { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import type { Transaction } from '../../types';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Sales', label: 'Sales' },
  { id: 'Labor', label: 'Labor' },
  { id: 'Vitamins & Medicine', label: 'Vitamins & Meds' },
  { id: 'Transport Costs', label: 'Transport' },
  { id: 'Misc Expenses', label: 'Misc' },
] as const;

const CATEGORIES = [
  'Sales', 'Labor', 'Vitamins & Medicine',
  'Transport Costs', 'Misc Expenses',
] as const;

export default function AdminLedger() {
  const { state, deleteTransaction, updateState } = useFarm();
  const { showToast } = useToast();
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ description: string; amount: number; category: string; type: 'revenue' | 'expense' }>({ description: '', amount: 0, category: '', type: 'expense' });

  const filtered = state.transactions.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.category === activeFilter;
  });

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ description: t.description, amount: t.amount, category: t.category, type: t.type });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editForm.description.trim()) {
      showToast('Description is required');
      return;
    }
    if (editForm.amount <= 0) {
      showToast('Amount must be greater than 0');
      return;
    }
    updateState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id
          ? { ...t, description: editForm.description, amount: editForm.amount, category: editForm.category, type: editForm.type }
          : t
      ),
    }));
    setEditingId(null);
    showToast('Transaction updated');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction permanently? This cannot be undone.')) {
      deleteTransaction(id);
      showToast('Transaction deleted');
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-homestead-green opacity-75">
          📋 Manage Ledger Entries
        </h3>
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold border border-homestead-green shrink-0 cursor-pointer ${
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
            No transactions match this filter.
          </div>
        ) : (
          filtered.map((t) => {
            const formattedDate = new Date(t.date).toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
            });
            const isRev = t.type === 'revenue';
            const isEditing = editingId === t.id;

            if (isEditing) {
              return (
                <article key={t.id} className="bg-white p-4 rounded-xl border-2 border-homestead-terracotta shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider">✏️ Editing</span>
                    <span className="text-[10px] text-homestead-green/60 font-semibold">{formattedDate}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Description</label>
                    <input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Amount (₱)</label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">Type</label>
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'revenue' | 'expense' })}
                        className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
                      >
                        <option value="expense">Expense</option>
                        <option value="revenue">Revenue</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(t.id)}
                      className="flex-1 bg-homestead-green text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-200 text-homestead-green text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-gray-300 active:scale-95 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </article>
              );
            }

            return (
              <article key={t.id} className="bg-white p-3.5 rounded-xl border border-homestead-green shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${
                        isRev ? 'bg-homestead-light-green text-homestead-green' : 'bg-homestead-beige border border-homestead-green/30'
                      }`}>
                        {t.category}
                      </span>
                      <span className="text-[10px] text-homestead-green/60 font-semibold">{formattedDate}</span>
                    </div>
                    <p className="text-sm font-bold text-homestead-green truncate">{t.description}</p>
                  </div>
                  <div className="text-right flex items-center space-x-2 shrink-0 ml-2">
                    <span className={`text-sm font-black ${isRev ? 'text-green-700' : 'text-homestead-terracotta'}`}>
                      {isRev ? '+' : '-'}₱{t.amount.toFixed(2)}
                    </span>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => startEdit(t)}
                        className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center font-bold text-xs cursor-pointer"
                        aria-label="Edit entry"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="w-7 h-7 rounded-full bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center font-bold text-xs cursor-pointer"
                        aria-label="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
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
