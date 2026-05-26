import { useFarm } from '../../context/FarmContext';

export default function FinancialSnapshot() {
  const { state } = useFarm();

  const totalIncome = state.transactions
    .filter((t) => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <article className="bg-white rounded-2xl p-5 border-2 border-homestead-green shadow-[4px_4px_0px_0px_rgba(26,58,43,1)]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-homestead-green opacity-75">
        Financial Snapshot
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-4 border-b border-dashed border-homestead-green/30 pb-3">
        <div>
          <span className="text-xs block text-homestead-green/70">Total Income</span>
          <span className="text-lg font-bold text-homestead-green">
            +₱{totalIncome.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-xs block text-homestead-green/70">Total Expenses</span>
          <span className="text-lg font-bold text-homestead-terracotta">
            -₱{totalExpenses.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Net Farm Balance:</span>
        <span
          className={`text-xl font-black px-3 py-1 rounded-lg border ${
            netBalance >= 0
              ? 'bg-[#E3EFE5] text-[#1A3A2B] border-homestead-green'
              : 'bg-[#FCECE8] text-[#C86446] border-homestead-terracotta'
          }`}
        >
          {netBalance >= 0 ? '+' : ''}₱{netBalance.toFixed(2)}
        </span>
      </div>
    </article>
  );
}
