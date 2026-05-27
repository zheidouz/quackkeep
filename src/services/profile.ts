import type { FarmerProfile } from '../types';

const API_BASE = '/_/backend/api/profile';

export async function fetchProfile(): Promise<FarmerProfile> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch farmer profile');
  return res.json();
}

export async function saveProfile(profile: FarmerProfile): Promise<FarmerProfile> {
  const res = await fetch(API_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to save farmer profile');
  return res.json();
}
