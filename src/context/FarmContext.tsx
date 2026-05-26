import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { FarmState, Transaction, LogEventType } from '../types';
import { fetchFarmState, saveFarmState, resetFarmStateApi } from '../services/api';

const defaultState: FarmState = {
  ducksCount: 0,
  eggsOnHand: 0,
  totalEggsSold: 0,
  feedKgRemaining: 0,
  feedConsumptionPerDuckPerDay: 0.15,
  eggDefaultSalePrice: 0.5,
  duckDefaultSalePrice: 15.0,
  transactions: [],
};

interface FarmContextValue {
  state: FarmState;
  loading: boolean;
  error: string | null;
  updateState: (updater: (prev: FarmState) => FarmState) => void;
  resetState: () => Promise<void>;
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  processLogEvent: (type: LogEventType, qty: number, desc: string, feedPricePerKg?: number, duckSellPrice?: number) => string | null;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FarmState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from MongoDB on mount
  useEffect(() => {
    fetchFarmState()
      .then((data) => setState(data))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  // Persist helper: update state then save to MongoDB
  const updateAndSave = useCallback((updater: (prev: FarmState) => FarmState) => {
    setState((prev) => {
      const next = updater(prev);
      saveFarmState(next).catch((err) => setError(err instanceof Error ? err.message : String(err)));
      return next;
    });
  }, []);

  const updateState = useCallback(
    (updater: (prev: FarmState) => FarmState) => updateAndSave(updater),
    [updateAndSave],
  );

  const resetState = useCallback(async () => {
    try {
      const fresh = await resetFarmStateApi();
      setState(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const addTransaction = useCallback(
    (t: Transaction) => updateAndSave((prev) => ({ ...prev, transactions: [t, ...prev.transactions] })),
    [updateAndSave],
  );

  const deleteTransaction = useCallback(
    (id: string) => updateAndSave((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((tx) => tx.id !== id),
    })),
    [updateAndSave],
  );

  const processLogEvent = useCallback(
    (type: LogEventType, qty: number, desc: string, feedPricePerKg?: number, duckSellPrice?: number): string | null => {
      if (qty <= 0) return 'Please enter a valid quantity.';

      let message: string | null = null;

      updateAndSave((prev) => {
        let next = { ...prev };
        let transaction: Transaction | null = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: 'expense',
          amount: 0,
          category: 'Misc Expenses',
          description: desc || 'Daily entry log',
        };

        switch (type) {
          case 'egg-collect': {
            next.eggsOnHand += qty;
            transaction = null;
            message = `Collected +${qty} Eggs`;
            break;
          }
          case 'egg-sell': {
            if (qty > next.eggsOnHand) {
              message = 'Error: Not enough eggs in inventory!';
              return prev;
            }
            next.eggsOnHand -= qty;
            next.totalEggsSold += qty;
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'revenue',
              amount: qty * prev.eggDefaultSalePrice,
              category: 'Sales',
              description: desc || `Sold ${qty} eggs`,
            };
            message = `Sold +${qty} Eggs for ₱${transaction.amount.toFixed(2)}`;
            break;
          }
          case 'duck-add': {
            next.ducksCount += qty;
            transaction = null;
            message = `Flock increased +${qty} ducks`;
            break;
          }
          case 'duck-sell': {
            if (qty > next.ducksCount) {
              message = 'Error: Not enough ducks in flock!';
              return prev;
            }
            const duckPrice = duckSellPrice ?? prev.duckDefaultSalePrice;
            next.ducksCount -= qty;
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'revenue',
              amount: qty * duckPrice,
              category: 'Sales',
              description: desc || `Sold ${qty} ducks @ ₱${duckPrice}/duck`,
            };
            message = `Sold +${qty} Ducks for ₱${(qty * duckPrice).toFixed(2)}`;
            break;
          }
          case 'duck-lost': {
            if (qty > next.ducksCount) {
              message = 'Error: Not enough ducks in flock!';
              return prev;
            }
            next.ducksCount -= qty;
            transaction = null;
            message = `Lost -${qty} ducks`;
            break;
          }
          case 'feed-buy': {
            const price = feedPricePerKg ?? 0;
            next.feedKgRemaining += qty;
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'expense',
              amount: qty * price,
              category: 'Misc Expenses',
              description: desc || `Purchased ${qty}kg feed @ ₱${price}/kg`,
            };
            message = `Purchased +${qty}kg Feed for ₱${(qty * price).toFixed(2)}`;
            break;
          }
          case 'feed-use': {
            if (qty > next.feedKgRemaining) {
              message = 'Error: Not enough feed left!';
              return prev;
            }
            next.feedKgRemaining -= qty;
            transaction = null;
            message = `Used -${qty}kg Feed stock`;
            break;
          }
          case 'expense-labor': {
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'expense',
              amount: qty,
              category: 'Labor',
              description: desc || 'Paid farm labor',
            };
            message = `Logged Labor Cost: ₱${qty}`;
            break;
          }
          case 'expense-med': {
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'expense',
              amount: qty,
              category: 'Vitamins & Medicine',
              description: desc || 'Vitamins & vet costs',
            };
            message = `Logged Medicine Cost: ₱${qty}`;
            break;
          }
          case 'expense-transport': {
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'expense',
              amount: qty,
              category: 'Transport Costs',
              description: desc || 'Transport costs',
            };
            message = `Logged Transport Cost: ₱${qty}`;
            break;
          }
          case 'expense-misc': {
            transaction = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'expense',
              amount: qty,
              category: 'Misc Expenses',
              description: desc || 'Misc expenses',
            };
            message = `Logged Misc Cost: ₱${qty}`;
            break;
          }
        }

        if (transaction) {
          next.transactions = [transaction, ...next.transactions];
        }

        return next;
      });

      return message;
    },
    [updateAndSave],
  );

  return (
    <FarmContext.Provider
      value={{ state, loading, error, updateState, resetState, addTransaction, deleteTransaction, processLogEvent }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
