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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export type ViewId = 'dashboard' | 'ledger' | 'recalibrate' | 'chat';

export type LogEventType =
  | 'egg-collect'
  | 'egg-sell'
  | 'duck-buy'
  | 'duck-hatch'
  | 'duck-sell'
  | 'duck-lost'
  | 'feed-buy'
  | 'feed-use'
  | 'expense-labor'
  | 'expense-med'
  | 'expense-transport'
  | 'expense-misc';
