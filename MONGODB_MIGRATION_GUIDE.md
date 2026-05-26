# MongoDB Atlas Migration Guide

A step-by-step guide to move from `localStorage` to **MongoDB Atlas** as the persistent backend for QuackKeep.

---

## Table of Contents

1. [Create a MongoDB Atlas Cluster](#1-create-a-mongodb-atlas-cluster)
2. [Set Up the Backend Project](#2-set-up-the-backend-project)
3. [Define Mongoose Schemas](#3-define-mongoose-schemas)
4. [Create REST API Routes](#4-create-rest-api-routes)
5. [Connect Frontend to Backend](#5-connect-frontend-to-backend)
6. [Replace `FarmContext` with API Calls](#6-replace-farmcontext-with-api-calls)
7. [Run Everything Together](#7-run-everything-together)

---

## 1. Create a MongoDB Atlas Cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up or log in.
2. Click **"Create a Deployment"** → choose **"Free" (M0)** tier.
3. Select a cloud provider and region (choose one close to you).
4. Click **"Create Cluster"** — it takes 1–3 minutes to provision.
5. Once ready, click **"Connect"**:
   - Add your IP address to the **Network Access** whitelist.
   - Create a **Database User** (username + password) — save these credentials.
   - Choose **"Drivers"** as the connection method.
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/quackkeep?retryWrites=true&w=majority
     ```

---

## 2. Set Up the Backend Project

From the project root, create a `backend` folder and initialize it.

```bash
cd "c:\Users\Client\Desktop\Gemini Projects\duck-deepseek-v1"
mkdir backend
cd backend
npm init -y
```

Install dependencies:

```bash
npm install express mongoose cors dotenv
npm install -D typescript @types/express @types/cors @types/node tsx
```

Create a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

Create the folder structure:

```bash
mkdir src src/models src/routes
```

Create `.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/quackkeep?retryWrites=true&w=majority
PORT=3001
```

---

## 3. Define Mongoose Schemas (`backend/src/models/`)

### `FarmState.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface ITransaction {
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
```

---

## 4. Create REST API Routes (`backend/src/routes/`)

### `farm.ts`

```typescript
import { Router, Request, Response } from 'express';
import FarmState from '../models/FarmState';

const router = Router();

// GET /api/farm — fetch the single farm document
router.get('/', async (_req: Request, res: Response) => {
  try {
    let farm = await FarmState.findOne();
    if (!farm) {
      farm = await FarmState.create({});
    }
    res.json(farm);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch farm state' });
  }
});

// PUT /api/farm — replace the entire farm state
router.put('/', async (req: Request, res: Response) => {
  try {
    let farm = await FarmState.findOne();
    if (!farm) {
      farm = new FarmState();
    }
    Object.assign(farm, req.body);
    await farm.save();
    res.json(farm);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update farm state' });
  }
});

// POST /api/farm/reset — reset to defaults
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await FarmState.deleteMany({});
    const farm = await FarmState.create({});
    res.json(farm);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset farm state' });
  }
});

export default router;
```

### `server.ts` (entry point)

```typescript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import farmRoutes from './routes/farm';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/farm', farmRoutes);

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
```

Update `package.json` scripts:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

---

## 5. Connect Frontend to Backend

Update the Vite config to proxy API requests to the backend:

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 6. Replace `FarmContext` with API Calls

Create a new API service file:

### `src/services/api.ts`

```typescript
import type { FarmState } from '../types';

const API_BASE = '/api/farm';

export async function fetchFarmState(): Promise<FarmState> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch farm state');
  const data = await res.json();
  return {
    ducksCount: data.ducksCount,
    eggsOnHand: data.eggsOnHand,
    totalEggsSold: data.totalEggsSold,
    feedKgRemaining: data.feedKgRemaining,
    feedConsumptionPerDuckPerDay: data.feedConsumptionPerDuckPerDay,
    eggDefaultSalePrice: data.eggDefaultSalePrice,
    duckDefaultSalePrice: data.duckDefaultSalePrice,
    transactions: data.transactions,
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

export async function resetFarmState(): Promise<FarmState> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset farm state');
  return res.json();
}
```

Now replace `useLocalStorage` in `FarmContext.tsx` with the API service. The key changes:

1. Remove `usePersistedFarmState` — use a regular `useState` + `useEffect` to load on mount
2. All state mutations (addTransaction, deleteTransaction, processLogEvent) call `saveFarmState` after updating

Here's the refactored `FarmContext.tsx`:

```typescript
import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { FarmState, Transaction, LogEventType } from '../types';
import { fetchFarmState, saveFarmState, resetFarmState as apiReset } from '../services/api';

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

  // Load from API on mount
  useEffect(() => {
    fetchFarmState()
      .then((data) => setState(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Persist helper: update state then save to API
  const updateAndSave = useCallback((updater: (prev: FarmState) => FarmState) => {
    setState((prev) => {
      const next = updater(prev);
      saveFarmState(next).catch((err) => setError(err.message));
      return next;
    });
  }, []);

  const resetState = useCallback(async () => {
    try {
      const fresh = await apiReset();
      setState(fresh);
    } catch (err: any) {
      setError(err.message);
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
      // ... (same business logic as before, but using updateAndSave instead of setState)
      // Copy the full switch statement from the current FarmContext.tsx here,
      // replacing `setState` with `updateAndSave` and `DB.save()` with nothing.
    },
    [updateAndSave],
  );

  return (
    <FarmContext.Provider value={{ state, loading, error, updateState: updateAndSave, resetState, addTransaction, deleteTransaction, processLogEvent }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}
```

> **Note:** The `processLogEvent` switch statement is identical to the current one — just replace every `setState((prev) => { ... return next; })` with `updateAndSave((prev) => { ... return next; })`.

---

## 7. Run Everything Together

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

### Terminal 2 — Frontend

```bash
cd "c:\Users\Client\Desktop\Gemini Projects\duck-deepseek-v1"
npm run dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3001`, which connects to MongoDB Atlas.

### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd backend && npm run build

# Serve both from a single server, or deploy separately
```

---

## Folder Structure After Migration

```
duck-deepseek-v1/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── FarmState.ts
│   │   ├── routes/
│   │   │   └── farm.ts
│   │   └── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                  # ← contains MONGODB_URI (do NOT commit)
├── src/
│   ├── services/
│   │   └── api.ts            # ← new API client
│   ├── context/
│   │   └── FarmContext.tsx   # ← updated to use API
│   └── ... (rest of frontend)
├── package.json
└── vite.config.ts            # ← proxy added
```

---

## Important Notes

- **`.env` must never be committed** — add `backend/.env` to `.gitignore`.
- **MongoDB Atlas Free Tier (M0)** gives you 512 MB of storage — plenty for a farm tracker.
- **Network Access:** You must whitelist your deployment server's IP (or `0.0.0.0/0` for development).
- **Offline fallback:** Consider keeping `localStorage` as a fallback when the API is unreachable.
