# Polymarket Futures Monitoring

Futures-focused monitoring and alerting built on Polymarket data. Includes a base capability API layer and a business layer for 24h tracking and alerts.

## Features

- **Futures Monitoring**: 24h tracking with movement and insider alerts
- **Ops Monitoring**: API health and request metrics dashboard
- **Base API Layer**: Search and orderbook capability endpoints (with LLM query rewrite)

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development Server

```bash
# Default - no proxy (direct connection)
npm run dev

# With proxy
npm run dev:proxy
# or
HTTP_PROXY="http://127.0.0.1:1087" npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Background (local-service)

与 Cursor **local-service** skill 约定一致：默认在 **3010** 端口后台启动 Next 开发服务（避免占用 3000），健康检查为 `/api/health`。

```bash
./start-bg.sh    # PORT=3010，日志 poly-sdk-web.log
./stop-bg.sh
# 自定义端口：PORT=3020 ./start-bg.sh  （stop 需相同 PORT）
```

配置已登记在 `~/.local-service/services.json`（`poly-sdk-web`）。

### Production Build

```bash
npm run build
npm start
```

## API Reliability Configuration

This project includes several optimizations to make Polymarket API calls more reliable. The APIs are protected by Cloudflare with TLS fingerprinting and rate limiting.

### Key Optimizations

| Technique | Description | Implementation |
|-----------|-------------|----------------|
| **IPv4 Preference** | IPv6 connections to Cloudflare are less reliable | `NODE_OPTIONS="--dns-result-order=ipv4first"` |
| **Rate Limiting** | Minimum 1.5s between calls + random jitter | Built into `src/lib/proxy-fetch.ts` |
| **Exponential Backoff** | Retry on transient failures (up to 4x) | Delays: 3s, 6s, 12s, 24s |
| **Browser Headers** | Chrome User-Agent, Origin, Referer | Required to bypass bot detection |
| **No Brotli** | Avoid `Accept-Encoding` to prevent decode failures | Removed from headers |
| **Batch Requests** | Reduce total API call volume | `batchGetMarketsByConditionIds()`, etc. |

### Environment Variables

Polymarket endpoints are **HTTPS**. This project uses **undici** `ProxyAgent` on every `proxyFetch` call; the proxy URL is resolved as **`HTTPS_PROXY` → `HTTP_PROXY` → `ALL_PROXY`** (first set wins). Prefer **`HTTPS_PROXY`** so Node matches common tooling expectations.

```bash
# Recommended for HTTPS origins (Gamma, CLOB, Data API)
HTTPS_PROXY="http://127.0.0.1:1087"
# Also supported:
# HTTP_PROXY="http://127.0.0.1:1087"
# ALL_PROXY="http://127.0.0.1:1087"

# Optional: `npm run snapshot:themes` exits if no proxy is configured
# POLYMARKET_REQUIRE_PROXY=1

# This project’s documented local proxy (HTTP CONNECT): 1087
# Other tools may use 7890 (Clash) or 10809 (V2Ray) — set to match your client.
```

## Monitoring

The API layer exposes lightweight health and metrics endpoints for internal monitoring:

- `GET /api/health`
- `GET /api/metrics?limit=200`

Optional alerting via webhook:

```bash
ALERT_WEBHOOK_URL="https://your-webhook-endpoint"
ALERT_MIN_REQUESTS=20
ALERT_ERROR_RATE=0.2
ALERT_P95_MS=2500
ALERT_COOLDOWN_MS=300000
```

Futures alert webhook (optional, overrides ALERT_WEBHOOK_URL for futures alerts):

```bash
FUTURES_ALERT_WEBHOOK_URL="https://your-futures-alert-endpoint"
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server (no proxy) |
| `npm run dev:proxy` | Development server with proxy |
| `npm run build` | Build for production |
| `npm run start` | Production server (no proxy) |
| `npm run start:proxy` | Production server with proxy |
| `npm test` | Run unit tests (Jest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run snapshot:themes` | Pull Gamma tags + themed events (set proxy env yourself) |
| `npm run snapshot:themes:proxy` | Same, with **`http://127.0.0.1:1087`** as `HTTPS_PROXY` + `HTTP_PROXY` |

### E2E Tests

```bash
npx playwright install
npm run test:e2e
```

## Architecture

### API Proxy Pattern

All external Polymarket API calls are proxied through Next.js API routes in `src/app/api/`:

```
Client → Next.js API Route → Polymarket API
```

This provides:
- CORS handling for cross-origin requests
- Centralized rate limiting
- Error handling and retry logic

### Three Polymarket APIs

| API | Base URL | Purpose |
|-----|----------|---------|
| **Gamma API** | `https://gamma-api.polymarket.com` | Markets, events, tags, search |
| **Data API** | `https://data-api.polymarket.com` | Positions, trades, leaderboard |
| **CLOB API** | `https://clob.polymarket.com` | Orderbook, price history, trades |

### Core Libraries

- **`src/lib/proxy-fetch.ts`** - Enhanced HTTP client with rate limiting, retry logic, browser headers
- **`src/lib/sdk.ts`** - Main API client with Gamma, Data, and CLOB sub-APIs

## Troubleshooting

### Connection Errors (ECONNRESET)

If you see connection reset errors, ensure IPv4 preference is enabled:

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" npm run dev
```

### 403 Forbidden (CLOB API)

The CLOB API has stricter bot detection. Options:
1. Use a proxy: `HTTP_PROXY="http://127.0.0.1:1087" npm run dev`
2. Reduce request frequency (rate limiting is built-in)
3. The Gamma API provides most market data without strict limits

### Rate Limiting

The built-in rate limiter ensures:
- Minimum 1.5s between API calls
- 0-1s random jitter to avoid patterns
- Exponential backoff on failures

Check rate limiter status:

```typescript
import { getRateLimiterStats, getProxyConfig } from '@/lib/proxy-fetch';

console.log(getRateLimiterStats());
// { minInterval: 1500, jitter: 1000, maxRetries: 4 }

console.log(getProxyConfig());
// { proxyUrl: null, usingProxy: false, message: 'No proxy - direct connection' }
```

## Project Structure

```
src/
├── app/
│   ├── api/           # API route handlers (server-side proxy)
│   ├── console/       # Futures tooling pages
│   ├── layout.tsx     # Root layout with Sidebar
│   └── page.tsx       # Homepage with demo index
├── components/        # Reusable React components
└── lib/              # Core business logic
    ├── proxy-fetch.ts # Enhanced HTTP client
    └── sdk.ts         # Main API client
```

## Polymarket theme snapshot (hard rules)

To align **futures rewrite hard rules** with what is actually liquid on Polymarket, run:

```bash
npm run snapshot:themes
# If Gamma is unreachable (e.g. regional network), use a proxy (HTTPS targets → prefer HTTPS_PROXY):
HTTPS_PROXY="http://127.0.0.1:1087" npm run snapshot:themes
# Strict: require proxy or exit
# POLYMARKET_REQUIRE_PROXY=1 HTTPS_PROXY="http://127.0.0.1:1087" npm run snapshot:themes
```

This walks **Gamma `/tags`** (filtered by finance/geo/politics-related substrings), fetches **`/events?tag_id=…`**, and writes **`reports/polymarket-theme-snapshot.json`** with high-liquidity event titles, token/country/geo frequency, and suggested English seeds. Edit `src/data/polymarket-geolex.ts` (tag filters) and `src/lib/futures-rewrite-hard-rules/*.ts` using that report.

## API Layers

This project exposes two API layers:

1. **Base (Demo) Layer**: Raw capability endpoints for search and orderbooks.  
   Path prefix: `/api/base/*`  
   Examples: `/api/base/orderbook`, `/api/base/search`

2. **Business Layer (Futures)**: Business logic and monitoring/alerting for futures workflows.  
   Path prefix: `/api/futures/*`  
   Examples: `/api/futures/monitor`, `/api/futures/alerts`

## License

MIT
