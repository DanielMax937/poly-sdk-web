# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 16 demo application** for the @catalyst-team/poly-sdk - an interactive web interface for exploring Polymarket data and trading functionality. The app showcases 25+ demo pages covering market data, smart money tracking, arbitrage detection, and trading operations.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is currently configured (Playwright is installed but no tests exist).

## Architecture

### API Proxy Pattern

All external Polymarket API calls are proxied through Next.js API routes in `src/app/api/`. Client-side code calls internal APIs (e.g., `/api/markets`) which then call external services. This provides:

- CORS handling for cross-origin requests
- Server-side proxy support via `src/lib/proxy-fetch.ts`
- Centralized error handling

### Three Polymarket APIs

1. **Gamma API** (`https://gamma-api.polymarket.com`) - Market discovery, events, tags
2. **Data API** (`https://data-api.polymarket.com`) - User positions, leaderboard, trade history
3. **CLOB API** (`https://clob.polymarket.com`) - Order book, price history, trades

### Core Libraries

- **`src/lib/sdk.ts`** (932 lines) - Main API client with three sub-APIs: `gammaApi`, `dataApi`, `clobApi`. Contains helper functions for orderbook processing, arbitrage detection, and unified market data.
- **`src/lib/orders.ts`** (293 lines) - Authenticated order management using `@polymarket/clob-client`
- **`src/lib/proxy-fetch.ts`** - Fetch wrapper that routes requests through a local HTTP proxy (default: `http://127.0.0.1:1087`)

### Proxy Requirement

The application requires a local HTTP proxy for API access. Configure via `HTTP_PROXY` environment variable (default: `http://127.0.0.1:1087`). Common proxy ports: Clash=7890, V2Ray=10809.

### Directory Structure

```
src/
├── app/
│   ├── api/           # API route handlers (server-side proxy)
│   ├── demos/         # 25+ demo pages showcasing SDK features
│   ├── layout.tsx     # Root layout with Sidebar
│   └── page.tsx       # Homepage with demo index
├── components/        # Reusable React components
├── lib/              # Core business logic (sdk.ts, orders.ts, proxy-fetch.ts)
```

### Demo Pages

The `src/app/demos/` directory contains example implementations. When adding new features, create a demo page first to demonstrate the pattern. Existing demos cover:

- Basic usage (trending markets, orderbook)
- Smart money tracking (leaderboard, trader positions)
- Market analysis (arbitrage detection)
- Trading operations (orders, portfolio)
- Real-time features (price tracking, WebSocket simulation)

## Environment Variables

Required for trading operations (see `.env.example`):

```
POLY_PRIVATE_KEY         # Wallet private key (without 0x prefix)
POLY_API_KEY            # L2 API key from createOrDeriveApiKey()
POLY_API_SECRET         # L2 API secret
POLY_API_PASSPHRASE     # L2 API passphrase
POLY_SIGNATURE_TYPE     # 0=EOA, 1=Gnosis Safe, 2=MagicLink (default: 0)
POLY_FUNDER_ADDRESS     # Optional funder address
HTTP_PROXY              # Proxy URL (default: http://127.0.0.1:1087)
```

## TypeScript Configuration

- Path alias: `@/*` → `./src/*`
- Strict mode enabled
- Target: ES2017
- Module resolution: `bundler` (Next.js native)

## UI Design System

Custom glassmorphism design on dark theme (`#0a0a0f` background). See `src/app/globals.css` for:
- Glass card styles with blur and transparency
- Gradient text effects (blue → purple → pink)
- Primary/secondary button styles
- Responsive grid layouts
