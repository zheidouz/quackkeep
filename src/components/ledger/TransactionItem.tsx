import type { Transaction } from '../../types';

interface Props {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: Props) {
  const formattedDate = new Date(transaction.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const isRev = transaction.type === 'revenue';

  return (
    <article className="bg-white p-3.5 rounded-xl border border-homestead-green flex items-center justify-between shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span
            className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${
              isRev
                ? 'bg-[#E3EFE5] text-[#1A3A2B]'
                : 'bg-homestead-beige border border-homestead-green/30'
            }`}
          >
            {transaction.category}
          </span>
          <span className="text-[10px] text-homestead-green/60 font-semibold">{formattedDate}</span>
        </div>
        <p className="text-sm font-bold text-homestead-green">{transaction.description}</p>
      </div>
      <div className="text-right flex items-center space-x-2 shrink-0">
        <span className={`text-sm font-black ${isRev ? 'text-green-700' : 'text-homestead-terracotta'}`}>
          {isRev ? '+' : '-'}₱{transaction.amount.toFixed(2)}
        </span>
        <button
          onClick={() => onDelete(transaction.id)}
          className="w-8 h-8 rounded-full bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center font-bold text-xs"
          aria-label="Delete entry"
        >
          ✕
        </button>
      </div>
    </article>
  );
}
