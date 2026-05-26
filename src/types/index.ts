export interface Transaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  description: string;
}

export interface FarmState {
  ducksCount: number;
  eggsOnHand: number;
  totalEggsSold: number;
  feedKgRemaining: number;
  feedConsumptionPerDuckPerDay: number;
  eggDefaultSalePrice: number;
  duckDefaultSalePrice: number;
  transactions: Transaction[];
}

export type ViewId = 'dashboard' | 'ledger' | 'recalibrate';

export type LogEventType =
  | 'egg-collect'
  | 'egg-sell'
  | 'duck-add'
  | 'duck-sell'
  | 'duck-lost'
  | 'feed-buy'
  | 'feed-use'
  | 'expense-labor'
  | 'expense-med'
  | 'expense-transport'
  | 'expense-misc';
