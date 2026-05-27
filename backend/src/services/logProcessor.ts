/**
 * Shared log event processor — single source of truth for all farm event logic.
 * Used by both the REST API (farm routes) and the chat AI route.
 */

export type LogEventType =
  | 'egg-collect' | 'egg-sell' | 'duck-buy' | 'duck-hatch'
  | 'duck-sell' | 'duck-lost' | 'feed-buy' | 'feed-use'
  | 'expense-labor' | 'expense-med' | 'expense-transport' | 'expense-misc';

export interface LogEventData {
  type: LogEventType;
  qty: number;
  desc: string;
  unitPrice: number;
  infertileCount: number;
}

export interface FarmStateData {
  ducksCount: number;
  eggsOnHand: number;
  totalEggsSold: number;
  feedKgRemaining: number;
  feedConsumptionPerDuckPerDay: number;
  eggDefaultSalePrice: number;
  duckDefaultSalePrice: number;
}

export interface TransactionResult {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  description: string;
}

export interface LogEventResult {
  message: string | null;
  transaction: TransactionResult | null;
  stateChanges: Partial<FarmStateData>;
}

/**
 * Keywords → event type mapping for NLP log parsing.
 * Ordered: check multi-word phrases before single words.
 */
const EVENT_PATTERNS: { keywords: string[]; type: LogEventType }[] = [
  { keywords: ['nangolekta', 'nakolekta', 'collect', 'pulot'], type: 'egg-collect' },
  { keywords: ['benta.*itik', 'sell.*duck', 'bentang itik'], type: 'duck-sell' },
  { keywords: ['benta', 'sell', 'sold', 'bentang'], type: 'egg-sell' },
  { keywords: ['bili', 'buy', 'bought', 'bilhin'], type: 'duck-buy' },
  { keywords: ['pisa', 'hatch', 'napisa'], type: 'duck-hatch' },
  { keywords: ['patay', 'lost', 'namatay', 'nawala'], type: 'duck-lost' },
  { keywords: ['feed', 'feeds', 'feed bag', 'pakain'], type: 'feed-buy' },
  { keywords: ['gamit', 'use feed', 'consume'], type: 'feed-use' },
  { keywords: ['labor', 'sweldo', 'pasweldo', 'manggagawa'], type: 'expense-labor' },
  { keywords: ['vitamins', 'gamat', 'vet', 'beterinaryo', 'mediko'], type: 'expense-med' },
  { keywords: ['transport', 'hatid', 'sundo', 'byahe', 'deliver'], type: 'expense-transport' },
];

const CATEGORY_MAP: Record<string, string> = {
  'expense-labor': 'Labor',
  'expense-med': 'Vitamins & Medicine',
  'expense-transport': 'Transport Costs',
};

/**
 * Attempt to parse a farm log event from a natural language message.
 * Returns null if no event pattern matches.
 */
export function parseLogMessage(msg: string): LogEventData | null {
  const lower = msg.toLowerCase();

  const matched = EVENT_PATTERNS.find((p) =>
    p.keywords.some((k) => new RegExp(k, 'i').test(lower)),
  );
  if (!matched) return null;

  const nums = msg.match(/\d+/g);
  if (!nums) return null;
  const qty = parseInt(nums[0], 10);
  if (qty <= 0) return null;

  // Extract unit price
  const perUnitMatch = msg.match(/(?:tig-|@\s*|₱\s*|php\s*|halagang\s*)(\d+)\s*(?:each|per|bawat|kada)?/i);
  const eachMatch = msg.match(/(\d+)\s*(?:each|per|bawat|kada|piraso)/i);
  const totalMatch = msg.match(/(?:for\s*|total\s*|kabuuang\s*)(\d+)(?:\s*pesos|\s*php|\s*₱)?\s*(?!each|per|bawat|kada)/i);

  let unitPrice = perUnitMatch ? parseFloat(perUnitMatch[1]) : 0;
  if (!unitPrice && eachMatch) unitPrice = parseFloat(eachMatch[1]);
  if (!unitPrice && totalMatch && qty > 0) {
    unitPrice = parseFloat(totalMatch[1]) / qty;
  }

  return { type: matched.type, qty, desc: msg.trim(), unitPrice, infertileCount: 0 };
}

/**
 * Compute the result of a log event against current farm state.
 * Pure function — does NOT mutate or persist. Caller handles save.
 */
export function computeLogEvent(
  event: LogEventData,
  farm: FarmStateData,
): { result: LogEventResult; error: string | null } {
  let transaction: TransactionResult | null = null;
  let message: string | null = null;
  const changes: Partial<FarmStateData> = {};

  const now = new Date().toISOString();
  const makeTx = (type: 'revenue' | 'expense', amount: number, category: string, description: string): TransactionResult => ({
    id: crypto.randomUUID(), date: now, type, amount, category, description,
  });

  switch (event.type) {
    case 'egg-collect': {
      changes.eggsOnHand = farm.eggsOnHand + event.qty;
      message = `+${event.qty} eggs collected`;
      break;
    }
    case 'egg-sell': {
      if (event.qty > farm.eggsOnHand) return { result: { message: null, transaction: null, stateChanges: {} }, error: `Only ${farm.eggsOnHand} eggs available` };
      changes.eggsOnHand = farm.eggsOnHand - event.qty;
      changes.totalEggsSold = farm.totalEggsSold + event.qty;
      const eggPrice = event.unitPrice || farm.eggDefaultSalePrice;
      transaction = makeTx('revenue', event.qty * eggPrice, 'Sales', event.desc || `Sold ${event.qty} eggs @ ₱${eggPrice}`);
      message = `+${event.qty} eggs sold (₱${(event.qty * eggPrice).toFixed(2)})`;
      break;
    }
    case 'duck-buy': {
      changes.ducksCount = farm.ducksCount + event.qty;
      const buyPrice = event.unitPrice || 0;
      transaction = makeTx('expense', event.qty * buyPrice, 'Misc Expenses', event.desc || `Bought ${event.qty} ducks`);
      message = `+${event.qty} ducks bought`;
      break;
    }
    case 'duck-sell': {
      if (event.qty > farm.ducksCount) return { result: { message: null, transaction: null, stateChanges: {} }, error: `Only ${farm.ducksCount} ducks available` };
      changes.ducksCount = farm.ducksCount - event.qty;
      const duckPrice = event.unitPrice || farm.duckDefaultSalePrice;
      transaction = makeTx('revenue', event.qty * duckPrice, 'Sales', event.desc || `Sold ${event.qty} ducks`);
      message = `+${event.qty} ducks sold`;
      break;
    }
    case 'duck-lost': {
      if (event.qty > farm.ducksCount) return { result: { message: null, transaction: null, stateChanges: {} }, error: `Only ${farm.ducksCount} ducks available` };
      changes.ducksCount = farm.ducksCount - event.qty;
      message = `-${event.qty} ducks lost`;
      break;
    }
    case 'feed-buy': {
      changes.feedKgRemaining = farm.feedKgRemaining + event.qty;
      transaction = makeTx('expense', event.qty * (event.unitPrice || 0), 'Misc Expenses', event.desc || `Bought ${event.qty}kg feed`);
      message = `+${event.qty}kg feed purchased`;
      break;
    }
    case 'feed-use': {
      if (event.qty > farm.feedKgRemaining) return { result: { message: null, transaction: null, stateChanges: {} }, error: `Only ${farm.feedKgRemaining}kg feed available` };
      changes.feedKgRemaining = farm.feedKgRemaining - event.qty;
      message = `-${event.qty}kg feed used`;
      break;
    }
    case 'duck-hatch': {
      const totalEggs = event.qty + event.infertileCount;
      if (totalEggs > farm.eggsOnHand) return { result: { message: null, transaction: null, stateChanges: {} }, error: `Only ${farm.eggsOnHand} eggs available` };
      changes.eggsOnHand = farm.eggsOnHand - totalEggs;
      changes.ducksCount = farm.ducksCount + event.qty;
      message = event.infertileCount > 0
        ? `+${event.qty} ducklings hatched (${event.infertileCount} infertile eggs discarded)`
        : `+${event.qty} ducklings hatched`;
      break;
    }
    case 'expense-labor':
    case 'expense-med':
    case 'expense-transport': {
      const cat = CATEGORY_MAP[event.type] || 'Misc Expenses';
      transaction = makeTx('expense', event.qty, cat, event.desc || event.type.replace('expense-', ''));
      message = `Expense ₱${event.qty} recorded`;
      break;
    }
    default:
      return { result: { message: null, transaction: null, stateChanges: {} }, error: 'Unknown event type' };
  }

  return { result: { message, transaction, stateChanges: changes }, error: null };
}
