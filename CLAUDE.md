# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 16 futures monitoring application** built on @catalyst-team/poly-sdk. It provides a base capability API layer and a futures business layer for 24h tracking and alerting.

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

All external Polymarket API calls are proxied through Next.js API routes in `src/app/api/`. Client-side code calls internal APIs (e.g., `/api/base/search`) which then call external services. This provides:

- CORS handling for cross-origin requests
- Server-side proxy support via `src/lib/proxy-fetch.ts`
- Centralized error handling

### Three Polymarket APIs

1. **Gamma API** (`https://gamma-api.polymarket.com`) - Market discovery, events, tags
2. **Data API** (`https://data-api.polymarket.com`) - User positions, leaderboard, trade history
3. **CLOB API** (`https://clob.polymarket.com`) - Order book, price history, trades

### Core Libraries

- **`src/lib/sdk.ts`** (932 lines) - Main API client with three sub-APIs: `gammaApi`, `dataApi`, `clobApi`. Contains helper functions for orderbook processing, arbitrage detection, and unified market data.
- **`src/lib/proxy-fetch.ts`** - Undici `ProxyAgent` on every Polymarket `fetch`; proxy URL from **`HTTPS_PROXY` → `HTTP_PROXY` → `ALL_PROXY`**

### Proxy Requirement

Polymarket APIs are **HTTPS**. Prefer **`HTTPS_PROXY`** (e.g. `http://127.0.0.1:1087`); `HTTP_PROXY` / `ALL_PROXY` are also read. Local proxy for this repo is documented as **1087**.

### Directory Structure

```
src/
├── app/
│   ├── api/           # API route handlers (base + futures layers)
│   ├── demos/         # Futures tooling pages
│   ├── layout.tsx     # Root layout with Sidebar
│   └── page.tsx       # Homepage with demo index
├── components/        # Reusable React components
├── lib/              # Core business logic (sdk.ts, proxy-fetch.ts, futures-*)
```

### Demo Pages

The `src/app/console/` directory focuses on futures tooling:

- Futures Monitor (`/console/futures-monitor`)
- Futures Alerts (`/console/futures-alerts`)
- Operations Monitoring (`/console/ops-monitoring`)

## Environment Variables

```
HTTPS_PROXY             # Preferred for https:// Polymarket (or HTTP_PROXY / ALL_PROXY)
ALERT_WEBHOOK_URL       # Optional API alert webhook
FUTURES_ALERT_WEBHOOK_URL # Optional futures alert webhook
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
