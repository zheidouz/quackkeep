# 🦆 QuackKeep — Duck Farm Management

A mobile-first PWA for small-scale duck farmers to track inventory, finances, feed consumption, and get AI-powered farm advice via DeepSeek.

## Features

- **Dashboard** — Live inventory (ducks, eggs, feed), financial snapshot, feed depletion predictor, milestones
- **AI Chat** — Ask farming questions in Tagalog or English; the AI knows your farm stats and farmer profile
- **Quick Farm Log** — One-tap logging for egg collection, sales, duck purchases, feed, expenses, and more
- **Ledger** — Filterable transaction history with pagination
- **Admin Panel** — PIN-protected: recalibrate inventory, edit farmer profile, view full ledger
- **NLP Log Parsing** — Chat messages like "nakolekta 20 itlog tig-8" automatically record farm events

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Express, Mongoose (MongoDB Atlas), DeepSeek AI |
| Deployment | Vercel (unified frontend + serverless backend) |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- DeepSeek API key

### Setup

```bash
# Clone and install
git clone <repo-url>
cd duck-deepseek-v1
npm install
cd backend && npm install && cd ..

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and DeepSeek API key
```

### Environment Variables (`backend/.env`)

```
MONGODB_URI=mongodb+srv://...
PORT=3001
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat
```

### Development

```bash
# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173, proxies /_/backend → 3001)
npm run dev
```

### Production Build

```bash
npm run build        # Frontend: tsc + vite build
cd backend && npm run build  # Backend: tsc
```

### Deploy to Vercel

The `vercel.json` configures experimental unified hosting. Set environment variables in Vercel dashboard.

## Project Structure

```
├── src/                    # React frontend
│   ├── components/
│   │   ├── admin/          # Admin panel, ledger, profile
│   │   ├── chat/           # AI chat interface
│   │   ├── dashboard/      # Farm overview widgets
│   │   ├── layout/         # Header, bottom nav, error boundary
│   │   ├── ledger/         # Transaction list
│   │   ├── modal/          # Log modal, PIN modal
│   │   └── recalibrate/    # Inventory recalibration
│   ├── context/            # React contexts (Farm, Toast)
│   ├── hooks/              # Custom hooks
│   ├── services/           # API client functions
│   └── types/              # TypeScript interfaces
├── backend/
│   ├── api/                # Vercel serverless entrypoint
│   └── src/
│       ├── models/         # Mongoose schemas
│       ├── routes/         # Express route handlers
│       └── services/       # Shared business logic, validation
└── vercel.json             # Vercel deployment config
```

## License

Private — all rights reserved.

      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
