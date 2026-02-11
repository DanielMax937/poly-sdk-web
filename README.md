# Polymarket SDK Web Demo

Interactive web interface for exploring Polymarket data and trading functionality. Built with Next.js 16, showcasing 25+ demo pages covering market data, smart money tracking, arbitrage detection, and trading operations.

## Features

- **Market Data**: Trending markets, search, events, and price history
- **Smart Money Tracking**: Leaderboard, trader positions, activity feeds
- **Arbitrage Detection**: Real-time orderbook analysis and profit opportunities
- **Trading Operations**: Order management, portfolio tracking
- **Real-time Features**: Price tracking, WebSocket simulation

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

```bash
# Optional: Use a proxy for API calls
HTTP_PROXY="http://127.0.0.1:1087"

# Common proxy ports:
# - Clash: 7890
# - V2Ray: 10809
# - Custom: 1087
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server (no proxy) |
| `npm run dev:proxy` | Development server with proxy |
| `npm run build` | Build for production |
| `npm run start` | Production server (no proxy) |
| `npm run start:proxy` | Production server with proxy |

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
- **`src/lib/orders.ts`** - Authenticated order management using `@polymarket/clob-client`

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
│   ├── demos/         # 25+ demo pages
│   ├── layout.tsx     # Root layout with Sidebar
│   └── page.tsx       # Homepage with demo index
├── components/        # Reusable React components
└── lib/              # Core business logic
    ├── proxy-fetch.ts # Enhanced HTTP client
    ├── sdk.ts         # Main API client
    └── orders.ts      # Order management
```

## License

MIT
