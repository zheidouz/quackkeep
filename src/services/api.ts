import type { FarmState } from '../types';

const API_BASE = '/api/farm';

export async function fetchFarmState(): Promise<FarmState> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch farm state');
  const data = await res.json();
  return {
    ducksCount: data.ducksCount ?? 0,
    eggsOnHand: data.eggsOnHand ?? 0,
    totalEggsSold: data.totalEggsSold ?? 0,
    feedKgRemaining: data.feedKgRemaining ?? 0,
    feedConsumptionPerDuckPerDay: data.feedConsumptionPerDuckPerDay ?? 0.15,
    eggDefaultSalePrice: data.eggDefaultSalePrice ?? 0.5,
    duckDefaultSalePrice: data.duckDefaultSalePrice ?? 15.0,
    transactions: data.transactions ?? [],
  };
}

export async function saveFarmState(state: FarmState): Promise<void> {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error('Failed to save farm state');
}

export async function resetFarmStateApi(): Promise<FarmState> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset farm state');
  const data = await res.json();
  return {
    ducksCount: data.ducksCount ?? 0,
    eggsOnHand: data.eggsOnHand ?? 0,
    totalEggsSold: data.totalEggsSold ?? 0,
    feedKgRemaining: data.feedKgRemaining ?? 0,
    feedConsumptionPerDuckPerDay: data.feedConsumptionPerDuckPerDay ?? 0.15,
    eggDefaultSalePrice: data.eggDefaultSalePrice ?? 0.5,
    duckDefaultSalePrice: data.duckDefaultSalePrice ?? 15.0,
    transactions: data.transactions ?? [],
  };
}
