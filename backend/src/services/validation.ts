import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  type: z.enum(['revenue', 'expense']),
  amount: z.number().finite(),
  category: z.string().min(1),
  description: z.string(),
});

export const farmStateSchema = z.object({
  ducksCount: z.number().int().min(0).default(0),
  eggsOnHand: z.number().int().min(0).default(0),
  totalEggsSold: z.number().int().min(0).default(0),
  feedKgRemaining: z.number().min(0).default(0),
  feedConsumptionPerDuckPerDay: z.number().min(0).default(0.15),
  eggDefaultSalePrice: z.number().min(0).default(0.5),
  duckDefaultSalePrice: z.number().min(0).default(15),
  transactions: z.array(transactionSchema).default([]),
});

export const farmerProfileSchema = z.object({
  farmName: z.string().default('My Duck Farm'),
  farmerName: z.string().default('the farmer'),
  location: z.string().default(''),
  farmGoal: z.string().default(''),
  breed: z.string().default(''),
  since: z.string().default(''),
  customFields: z.record(z.string(), z.string()).default({}),
});

export type FarmStateInput = z.infer<typeof farmStateSchema>;
export type FarmerProfileInput = z.infer<typeof farmerProfileSchema>;
