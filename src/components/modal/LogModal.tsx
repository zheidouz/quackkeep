import { useState, useEffect, useRef, useCallback } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import type { LogEventType } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EVENT_OPTIONS: { value: LogEventType; label: string }[] = [
  { value: 'egg-collect', label: '🥚 Collect Eggs' },
  { value: 'egg-sell', label: '💰 Sell Eggs' },
  { value: 'duck-buy', label: '🦆 Buy Ducks' },
  { value: 'duck-hatch', label: '🐣 Hatch Ducks' },
  { value: 'duck-sell', label: '💰 Sell Ducks' },
  { value: 'duck-lost', label: '💔 Ducks Died/Lost' },
  { value: 'feed-buy', label: '🌾 Purchase Feed Bags' },
  { value: 'feed-use', label: '🧹 Clean & Use Feed' },
  { value: 'expense-labor', label: '👷 Paid Farm Labor' },
  { value: 'expense-med', label: '💊 Vitamins & Vet' },
  { value: 'expense-transport', label: '🚛 Transport Costs' },
  { value: 'expense-misc', label: '📦 Misc Repairs/Bedding' },
];

export default function LogModal({ open, onClose }: Props) {
  const { state, processLogEvent } = useFarm();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [eventType, setEventType] = useState<LogEventType>('egg-collect');
  const [qty, setQty] = useState(1);
  const [desc, setDesc] = useState('');
  const [unitPrice, setUnitPrice] = useState(0);
  const [infertileCount, setInfertileCount] = useState(0);

  // Sync dialog open state
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setQty(1);
      setDesc('');
      setUnitPrice(0);
      setInfertileCount(0);
      setEventType('egg-collect');
    } else if (!open && el.open) {
      el.close();
    }
    // Cleanup on unmount
    return () => { if (el?.open) el.close(); };
  }, [open]);

  // Close on backdrop click
  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === dialogRef.current) onClose();
  }, [onClose]);

  const handleTypeChange = (type: LogEventType) => {
    setEventType(type);
    setQty(1);
    setUnitPrice(0);
    setInfertileCount(0);
  };

  const adjustQty = (amount: number) => {
    setQty((prev) => Math.max(0, prev + amount));
  };

  const getQtyLabel = (): string => {
    switch (eventType) {
      case 'egg-collect': return 'Number of eggs collected';
      case 'egg-sell': return 'Number of eggs sold';
      case 'duck-buy': return 'Number of ducks bought';
      case 'duck-hatch': return 'Number of ducklings hatched';
      case 'duck-sell': return 'Number of ducks sold';
      case 'duck-lost': return 'Number of ducks died/lost';
      case 'feed-buy': return 'Weight of Feed purchased (kg)';
      case 'feed-use': return 'Weight of Feed used (kg)';
      default: return 'Total Cost amount (₱)';
    }
  };

  const isIncomeType = eventType === 'egg-sell' || eventType === 'duck-sell';
  const isExpenseType = eventType.startsWith('expense-');
  const showPreview = isIncomeType || isExpenseType || eventType === 'feed-buy';

  let previewAmount = 0;
  if (eventType === 'egg-sell') previewAmount = qty * (unitPrice || state.eggDefaultSalePrice);
  else if (eventType === 'duck-sell') previewAmount = qty * (unitPrice || state.duckDefaultSalePrice);
  else if (eventType === 'feed-buy') previewAmount = qty * unitPrice;
  else if (isExpenseType) previewAmount = qty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if ((eventType === 'feed-buy' || eventType === 'duck-sell' || eventType === 'duck-buy') && unitPrice <= 0) {
      const label = eventType === 'feed-buy' ? 'price per kg' : 'price per duck';
      showToast(`Please enter a valid ${label}.`);
      return;
    }

    const result = processLogEvent(eventType, qty, desc, unitPrice, unitPrice, infertileCount);
    if (result) {
      showToast(result);
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdrop}
      className="backdrop:bg-homestead-green/60 border-2 border-homestead-green rounded-2xl w-full max-w-sm p-5 bg-homestead-beige select-none focus:outline-none shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-homestead-green pb-2">
        <h3 className="font-bold text-md text-homestead-green flex items-center space-x-2">
          <span>➕</span> <span>Quick Farm Log</span>
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-homestead-green flex items-center justify-center font-bold text-xs cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Event Type */}
        <div>
          <label htmlFor="log-type" className="block text-xs font-bold mb-1 text-homestead-green/80">
            Choose daily event
          </label>
          <select
            id="log-type"
            value={eventType}
            onChange={(e) => {
              const val = e.target.value;
              if (EVENT_OPTIONS.some((o) => o.value === val)) {
                handleTypeChange(val as LogEventType);
              }
            }}
            className="w-full bg-white border border-homestead-green rounded-lg p-2.5 text-sm font-bold"
          >
            {EVENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Quantity Input */}
        <div>
          <label htmlFor="log-qty" className="block text-xs font-bold mb-1 text-homestead-green/80">
            {getQtyLabel()}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => adjustQty(-1)}
              className="w-12 h-12 border border-homestead-green bg-white rounded-lg font-black text-lg hover:bg-gray-100 select-none cursor-pointer"
              aria-label="Subtract 1"
            >
              -
            </button>
            <input
              id="log-qty"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
              className="flex-1 text-center h-12 bg-white border border-homestead-green rounded-lg text-lg font-bold"
              required
            />
            <button
              type="button"
              onClick={() => adjustQty(1)}
              className="w-12 h-12 border border-homestead-green bg-white rounded-lg font-black text-lg hover:bg-gray-100 select-none cursor-pointer"
              aria-label="Add 1"
            >
              +
            </button>
          </div>
        </div>

        {/* Infertile eggs — shown when hatching */}
        {eventType === 'duck-hatch' && (
          <div>
            <label htmlFor="log-infertile" className="block text-xs font-bold mb-1 text-homestead-green/80">
              Infertile eggs discarded
            </label>
            <input
              id="log-infertile"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={infertileCount}
              onChange={(e) => setInfertileCount(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="e.g. 3"
              className="w-full bg-white border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
            />
            <p className="text-[10px] text-homestead-green/60 mt-1">
              Eggs used = ducklings hatched + infertile discarded
            </p>
          </div>
        )}

        {/* Unit Price — shown when buying/selling */}
        {(eventType === 'egg-sell' || eventType === 'feed-buy' || eventType === 'duck-sell' || eventType === 'duck-buy') && (
          <div>
            <label htmlFor="log-unit-price" className="block text-xs font-bold mb-1 text-homestead-green/80">
              {eventType === 'egg-sell' ? 'Price per egg (₱) — leave 0 for default' : eventType === 'feed-buy' ? 'Price per kg (₱)' : 'Price per duck (₱)'}
            </label>
            <input
              id="log-unit-price"
              type="number"
              min={0}
              step={0.5}
              inputMode="decimal"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder={eventType === 'egg-sell' ? `Default: ₱${state.eggDefaultSalePrice}` : eventType === 'feed-buy' ? 'e.g. 85' : 'e.g. 500'}
              className="w-full bg-white border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="log-desc" className="block text-xs font-bold mb-1 text-homestead-green/80">
            Log note (optional)
          </label>
          <input
            id="log-desc"
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. Coop block C, extra seed"
            className="w-full bg-white border border-homestead-green rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Financial Preview */}
        {showPreview && previewAmount > 0 && (
          <div className="p-3 bg-white border border-dashed border-homestead-green rounded-lg text-center text-xs space-y-1">
            <div className="font-bold text-homestead-green/70">Transaction Value Forecast</div>
            <div className={`text-base font-black ${isIncomeType ? 'text-green-700' : 'text-homestead-terracotta'}`}>
              {isIncomeType ? '+' : '-'}₱{previewAmount.toFixed(2)}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-homestead-terracotta text-white font-bold uppercase py-3.5 rounded-xl hover:bg-opacity-95 active:scale-95 transition-all text-sm tracking-wider shadow cursor-pointer"
        >
          Process & Update Inventory
        </button>
      </form>
    </dialog>
  );
}
