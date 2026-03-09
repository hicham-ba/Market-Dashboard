# Market Universe Explorer v14

## Quick Start (local development)

```bash
npm install
npm run dev
```

## Deploy to Vercel (production)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Market Universe v14"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 2. Import in Vercel
- Go to vercel.com, import your repo
- Vercel auto-detects Vite framework

### 3. Add Environment Variables
In Vercel dashboard > Project > Settings > Environment Variables, add:

| Key | Value | Where to get it |
|-----|-------|-----------------|
| `FINNHUB_KEY` | Your Finnhub API key | finnhub.io/register (free) |
| `ANTHROPIC_KEY` | Your Anthropic API key | console.anthropic.com |

Click "Redeploy" after adding the variables.

### 4. Use the app
- Click **Fetch Live Prices** for real-time stock quotes
- Click **Fetch AI Intel** for smart money, flows, institutional data
- Click **Fetch All** for both at once

## Architecture

- `/api/finnhub.js` - Serverless proxy for Finnhub (keys stay on server)
- `/api/intel.js` - Serverless proxy for Anthropic API (keys stay on server)
- `/src/DowUniverse.jsx` - Main React app
- All API keys are in Vercel environment variables, never in code

## Costs

- Finnhub: Free tier (60 calls/min)
- Anthropic: ~$0.02-0.05 per intel refresh (3 calls to Sonnet with web search)
- ~$0.50-1.00 per trading day if refreshing every 30 min
