import mongoose, { Schema, type Document } from 'mongoose';

export interface ITransaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  description: string;
}

export interface IFarmState extends Document {
  ducksCount: number;
  eggsOnHand: number;
  totalEggsSold: number;
  feedKgRemaining: number;
  feedConsumptionPerDuckPerDay: number;
  eggDefaultSalePrice: number;
  duckDefaultSalePrice: number;
  transactions: ITransaction[];
}

const TransactionSchema = new Schema<ITransaction>({
  id: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['revenue', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const FarmStateSchema = new Schema<IFarmState>({
  ducksCount: { type: Number, default: 0 },
  eggsOnHand: { type: Number, default: 0 },
  totalEggsSold: { type: Number, default: 0 },
  feedKgRemaining: { type: Number, default: 0 },
  feedConsumptionPerDuckPerDay: { type: Number, default: 0.15 },
  eggDefaultSalePrice: { type: Number, default: 0.5 },
  duckDefaultSalePrice: { type: Number, default: 15.0 },
  transactions: [TransactionSchema],
});

export default mongoose.model<IFarmState>('FarmState', FarmStateSchema, 'farmstate');
