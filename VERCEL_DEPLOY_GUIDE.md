# Deploy QuackKeep to Vercel

A step-by-step guide to host your **QuackKeep** app (frontend + backend) on **Vercel** with MongoDB Atlas.

---

## Architecture Overview

```
Vercel                       MongoDB Atlas
┌────────────────────┐       ┌────────────┐
│  Static Assets     │       │  Cloud DB  │
│  (Vite build)      │       │            │
│                    │       │  farmstate │
│  Serverless API    │──────▶│  collection│
│  (/api/* functions)│       └────────────┘
└────────────────────┘
```

Vercel serves the built frontend files as a static site and runs the Express API as **Serverless Functions** (`/api/*`).

---

## Prerequisites

1. **Vercel account** — sign up at [vercel.com](https://vercel.com) (GitHub login recommended)
2. **GitHub repository** — your project pushed to GitHub
3. **MongoDB Atlas** — already set up (follow `MONGODB_MIGRATION_GUIDE.md`)

---

## Step 1 — Restructure Backend for Vercel Functions

Vercel expects serverless functions inside the `api/` folder at the project root (or configured via `vercel.json`).

Create a Vercel serverless handler that wraps the Express app:

### `api/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import farmRoutes from '../backend/src/routes/farm.js';

// DNS fix for SRV lookup (same as backend/src/server.ts)
dns.setServers(['121.54.70.162', '8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/farm', farmRoutes);

// Connect to MongoDB once and reuse
let cachedDb: typeof mongoose | null = null;

async function connectDB() {
  if (cachedDb) return;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ MongoDB connected');
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
```

> **Note:** The backend source files (`backend/src/models/`, `backend/src/routes/`) are **reused** — no need to duplicate them.

---

## Step 2 — Add `vercel.json` at Project Root

Create `vercel.json` to configure routing and the build step:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

---

## Step 3 — Update `package.json` Scripts

Add a Vercel build script to the root `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "vercel-build": "cd backend && npm install && cd .. && npm run build"
}
```

---

## Step 4 — Set Environment Variables in Vercel

In the **Vercel Dashboard** → your project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | `mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/quackkeep?retryWrites=true&w=majority` |

> ⚠️ Never commit this to your repository — only set it in Vercel's dashboard.

---

## Step 5 — Push to GitHub & Import to Vercel

```bash
# Make sure everything is committed
git add .
git commit -m "Ready for Vercel deployment"
git push
```

Then:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects the project — no framework override needed
4. Add the `MONGODB_URI` environment variable
5. Click **Deploy**

---

## Step 6 — Whitelist Vercel IPs in MongoDB Atlas

Vercel Functions don't have static IPs, so you need to allow access from anywhere:

1. Go to **MongoDB Atlas** → **Network Access**
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`)
4. Click **Confirm**

---

## Step 7 — Test Your Deployed App

Once deployed, Vercel gives you a URL like:

```
https://duck-deepseek-v1.vercel.app
```

- Visit the URL — the frontend loads
- Data is fetched from /api/farm → serverless function → MongoDB Atlas
- All CRUD operations work through the API proxy

---

## Alternative: Deploy Backend Separately

If you prefer a **separate backend** (e.g., on Render or Railway) instead of Vercel Functions:

### Option A — Deploy backend to Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. Set **Build Command** to `npm install && npm run build`
4. Set **Start Command** to `node dist/server.js`
5. Add the `MONGODB_URI` environment variable
6. Update `vite.config.ts` to point to your Render URL instead of proxying:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://your-app.onrender.com',
      changeOrigin: true,
    },
  },
},
```

### Option B — Deploy backend to Railway

1. Create a new project on [railway.com](https://railway.com)
2. Connect your GitHub repo, set **Root Directory** to `backend`
3. Set **Start Command** to `npm run start`
4. Add `MONGODB_URI` as an environment variable

Then deploy the frontend to Vercel with the proxy pointing to your Railway/Render URL.

---

## File Structure After Vercel Setup

```
duck-deepseek-v1/
├── api/
│   └── index.ts              ← Vercel serverless function
├── backend/
│   ├── src/
│   │   ├── models/FarmState.ts
│   │   ├── routes/farm.ts
│   │   └── server.ts
│   └── package.json
├── src/
│   └── ... (React frontend)
├── dist/                     ← Vite build output (gitignored)
├── vercel.json
├── vite.config.ts
├── package.json
└── MONGODB_MIGRATION_GUIDE.md
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `504: TIMEOUT` on first load | MongoDB connection takes a few seconds on cold start. Refresh after 5s. |
| `MongoServerError: bad auth` | Verify `MONGODB_URI` in Vercel env vars is correct (no typos). |
| `SRV lookup failed` | The DNS fix in `api/index.ts` handles this. If still failing, use the direct connection string format from the guide. |
| Frontend loads but API returns 404 | Check `vercel.json` rewrites are configured correctly. |
| CORS errors | Ensure `cors()` middleware is used in the API handler. |

---

## Quick Checklist

- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] `MONGODB_URI` environment variable set in Vercel dashboard
- [ ] `vercel.json` created at project root
- [ ] Backend is restructured as `api/index.ts` serverless function
- [ ] Backend source files (`backend/src/`) are pushed to GitHub
- [ ] Frontend builds successfully with `npm run build`
- [ ] All changes committed and pushed to GitHub
- [ ] Project imported and deployed on Vercel
