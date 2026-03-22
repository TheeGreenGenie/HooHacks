# Frontier Finance 🤠

A western-themed personal finance and stock trading platform built for HooHacks 2026. Frontier Finance combines AI-powered financial analysis, real-time stock prediction, OCR document scanning, voice chat, and a mini-game into a single cohesive experience — all wrapped in a frontier aesthetic.

---

## What We Built

### Income & Spending
Users upload bank statements, pay stubs, or any financial document (PDF, JPG, PNG). Google Cloud Vision extracts the raw text via OCR. A regex-based transaction parser identifies dates, descriptions, and amounts, categorizes them (dining, groceries, utilities, subscriptions, transport, shopping), and computes monthly totals, bills, disposable income, and yearly projections. Users can also enter manual income. All data is persisted to MongoDB keyed to their Auth0 identity. The page operates on a session model — changes are local until the user explicitly saves.

### Savings Suggestions
An AI routing layer queries Gemini, Snowflake, and OpenRouter in sequence, falling back to a rule-based engine if upstream providers fail or hit quota. Suggestions are tailored to the user's transaction history and shopping frequency (weekly, monthly, auto-delivery). Results are cached in-memory for 10 minutes to preserve API quota. A minimum of 6 suggestions is always guaranteed.

### Nearby Stores
Users search for items or browse by category (groceries, dining, shopping, transport, utilities). The backend queries merchant inventory data with optional geolocation filtering up to a 50-mile radius. Frequently purchased items from the user's transaction history are surfaced as quick-search chips. Store results are cached for 30 minutes.

### Stock Trading
Users search any ticker or company name. The backend fetches historical OHLCV data via Yahoo Finance, runs a TensorFlow LSTM + scikit-learn ensemble for next-day price prediction, and returns a full suite of Plotly charts — price history, volume, RSI, MACD, S&P 500 comparison, and a Boom Score rating. Users can buy and sell simulated positions stored in MongoDB with average cost tracking, P&L, and current value pulled live.

### Frontier Frank (Voice Chat)
An AI financial advisor powered by Gemini for natural language responses and ElevenLabs for text-to-speech audio. Users can ask anything about saving, investing, or budgeting and receive a spoken reply. Per-message voice replay is supported. Falls back to browser TTS if ElevenLabs is unavailable.

### Frontier Rider
A western-themed endless runner mini-game. The player jumps over bandits, sheriffs, and TNT barrels while collecting money bags, gold, and cattle for increasing cash rewards. Built entirely in React/Canvas with no external game engine.

### Authentication
Full Auth0 integration with JWT verification, TOTP two-factor authentication, email validation, password recovery, and magic link login. All finance and stock data is isolated per user via Auth0 sub.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Auth | Auth0 (`@auth0/nextjs-auth0`) |
| Backend | FastAPI, Python 3.11, uvicorn |
| Database | MongoDB with motor + odmantic |
| AI — Suggestions | Gemini (`google-generativeai`), Snowflake Cortex, OpenRouter |
| AI — Voice | ElevenLabs TTS, browser SpeechSynthesis fallback |
| OCR | Google Cloud Vision API |
| Stock Data | Yahoo Finance (`yfinance`, `yahooquery`) |
| Stock Prediction | TensorFlow LSTM, scikit-learn, pandas, NumPy |
| Charts | Plotly + react-plotly.js |
| Payments (stub) | Stripe, Solana, Wolfram Alpha |
| Tunnel | ngrok static domain |
| State | Redux Toolkit |

---

## Application Workflow

```
User logs in via Auth0
        │
        ├─► Profile page — name, age, phone, display name stored in MongoDB
        │
        ├─► Income & Spending
        │       │
        │       ├─ Upload document → OCR → parse transactions → store in MongoDB
        │       ├─ Manual income entry → Apply (local recalculate) → Save (persist to DB)
        │       └─ Dashboard: monthly income, expenses, bills, disposable income, yearly projections
        │
        ├─► Savings Suggestions
        │       │
        │       ├─ Pull user transaction history from MongoDB
        │       ├─ Route through Gemini → Snowflake → OpenRouter → local fallback
        │       └─ Return ≥6 categorized suggestions with estimated monthly savings
        │
        ├─► Nearby Stores
        │       │
        │       ├─ Derive frequent items from transaction history
        │       ├─ Search merchant inventory by category or item name
        │       └─ Filter by geolocation radius (up to 50 miles)
        │
        ├─► Stocks
        │       │
        │       ├─ Search ticker → fetch OHLCV via Yahoo Finance
        │       ├─ Run LSTM + sklearn ensemble → next-day prediction + confidence interval
        │       ├─ Render Plotly charts (price, volume, RSI, MACD, S&P comparison, Boom Score)
        │       ├─ Buy → record position in MongoDB (shares, avg cost, payment method)
        │       └─ Portfolio → live P&L against current price
        │
        ├─► Frontier Frank
        │       │
        │       ├─ User types or speaks a question
        │       ├─ Gemini generates a financial advisor response
        │       └─ ElevenLabs synthesizes speech → plays in browser
        │
        └─► Frontier Rider
                └─ Endless runner — jump obstacles, collect money, track distance
```

---

## Requirements

**API Keys & Services required:**

| Service | Purpose |
|---|---|
| Auth0 | Authentication, JWT, TOTP |
| Google Cloud Vision | OCR document scanning |
| Gemini (Google AI Studio) | AI suggestions + voice chat responses |
| ElevenLabs | Text-to-speech for Frontier Frank |
| AlphaVantage | Stock market data enrichment |
| OpenRouter | Secondary AI provider for suggestions |
| Snowflake Cortex | Primary AI provider for suggestions |
| MongoDB | User data, transactions, portfolios |

All AI providers degrade gracefully — if a key is missing or quota is exceeded, the system falls back to the next provider in the chain and ultimately to a rule-based engine. The app remains fully functional without any AI keys.

**Prerequisites:**

- Python 3.11+
- Node.js 18+
- MongoDB installed locally
- ngrok installed and authenticated (for public tunnel)

---

## Credits & Inspiration

- **Dino Game** by [apex-code002](https://github.com/apex-code002/Dino-Game) — original endless runner logic that inspired the Frontier Rider mini-game
- **Full Stack FastAPI & Next.js** boilerplate — base project structure for the HHP backend/frontend scaffold
- **inboard** by [br3ndonland](https://github.com/br3ndonland/inboard) — FastAPI + gunicorn/uvicorn Docker base image
- **Traefik** — reverse proxy and SSL termination in the Docker stack
- **Plotly** — interactive financial charts
- **odmantic** — MongoDB ODM for async FastAPI
- **Auth0** — authentication infrastructure

---

*Built at HooHacks 2026*
