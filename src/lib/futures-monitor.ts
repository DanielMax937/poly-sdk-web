import { gammaApi, clobApi, processOrderbook, detectInsiderTrading, type GammaMarket } from '@/lib/sdk';
import { rewriteFuturesQuery } from '@/lib/futures-rewrite';

export type FuturesAlert = {
  id: string;
  timestamp: number;
  conditionId: string;
  question: string;
  keyword: string;
  type: 'movement' | 'insider';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: unknown;
};

type OrderbookSnapshot = {
  timestamp: number;
  bidDepth: number;
  askDepth: number;
  largestBid: number;
  largestAsk: number;
  imbalanceRatio: number;
};

export type FuturesMonitorStatus = {
  running: boolean;
  intervalMs: number;
  keywords: string[];
  lastRunAt: number | null;
  alertsCount: number;
};

const DEFAULT_KEYWORDS = [
  'gold', 'silver', 'oil', 'bitcoin', 'ethereum',
  'natural gas', 'copper', 'corn', 'wheat', 'soybean'
];

const DEFAULT_CONFIG = {
  intervalMs: 60_000,
  minLiquidity: 2000,
  maxMarketsPerKeyword: 5,
  concurrency: 3,
  alertCooldownMs: 5 * 60_000,
  maxAlerts: 200,
};

const FUTURES_ALERT_WEBHOOK_URL = process.env.FUTURES_ALERT_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL || '';

let running = false;
let intervalHandle: NodeJS.Timeout | null = null;
let lastRunAt: number | null = null;
let keywords = [...DEFAULT_KEYWORDS];
let intervalMs = DEFAULT_CONFIG.intervalMs;

const snapshots = new Map<string, OrderbookSnapshot>();
const lastAlertAt = new Map<string, number>();
const alerts: FuturesAlert[] = [];
let rewriteCache = new Map<string, string[]>();
let lastRewriteAt: number | null = null;

function pushAlert(alert: FuturesAlert) {
  alerts.push(alert);
  if (alerts.length > DEFAULT_CONFIG.maxAlerts) {
    alerts.splice(0, alerts.length - DEFAULT_CONFIG.maxAlerts);
  }
}

async function sendAlert(alert: FuturesAlert) {
  if (!FUTURES_ALERT_WEBHOOK_URL) return;
  try {
    await fetch(FUTURES_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'futures.alert', alert }),
    });
  } catch {
    // ignore webhook failures
  }
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(mapper));
    results.push(...chunkResults);
  }
  return results;
}

async function buildRewriteCache(nextKeywords: string[]) {
  const startedAt = Date.now();
  const entries = await mapWithConcurrency(
    nextKeywords,
    DEFAULT_CONFIG.concurrency,
    async (keyword) => {
      try {
        const terms = await rewriteFuturesQuery(keyword);
        return {
          keyword,
          terms: Array.isArray(terms) && terms.length > 0 ? terms : [keyword],
        };
      } catch {
        return { keyword, terms: [keyword] };
      }
    }
  );

  const nextCache = new Map<string, string[]>();
  let rewritesCount = 0;
  entries.forEach(({ keyword, terms }) => {
    nextCache.set(keyword, terms);
    rewritesCount += terms.length;
  });

  rewriteCache = nextCache;
  lastRewriteAt = Date.now();

  return {
    keywords: [...nextKeywords],
    rewritesCount,
    durationMs: Date.now() - startedAt,
  };
}

function shouldAlert(conditionId: string, now: number) {
  const last = lastAlertAt.get(conditionId) || 0;
  if (now - last < DEFAULT_CONFIG.alertCooldownMs) return false;
  lastAlertAt.set(conditionId, now);
  return true;
}

function detectMovement(prev: OrderbookSnapshot, next: OrderbookSnapshot) {
  const bidDepthChange = ((next.bidDepth - prev.bidDepth) / (prev.bidDepth || 1)) * 100;
  const askDepthChange = ((next.askDepth - prev.askDepth) / (prev.askDepth || 1)) * 100;
  const bidSizeChange = ((next.largestBid - prev.largestBid) / (prev.largestBid || 1)) * 100;
  const imbalanceChange = Math.abs(next.imbalanceRatio - prev.imbalanceRatio);

  const hasMovement =
    Math.abs(bidDepthChange) > 50 ||
    Math.abs(askDepthChange) > 50 ||
    bidSizeChange > 100 ||
    imbalanceChange > 1;

  const changes: string[] = [];
  if (Math.abs(bidDepthChange) > 50) changes.push(`Bid depth ${bidDepthChange.toFixed(0)}%`);
  if (Math.abs(askDepthChange) > 50) changes.push(`Ask depth ${askDepthChange.toFixed(0)}%`);
  if (bidSizeChange > 100) changes.push(`Large bid +${bidSizeChange.toFixed(0)}%`);
  if (imbalanceChange > 1) changes.push(`Imbalance Δ${imbalanceChange.toFixed(1)}`);

  return { hasMovement, changes, bidDepthChange, askDepthChange, bidSizeChange, imbalanceChange };
}

async function fetchKeywordMarkets(keyword: string): Promise<GammaMarket[]> {
  const rewrites = rewriteCache.get(keyword) || [keyword];
  const terms = rewrites.slice(0, 8);

  const resultsList = await mapWithConcurrency(
    terms,
    DEFAULT_CONFIG.concurrency,
    async (term) => gammaApi.search(term)
  );

  const eventMarkets = resultsList.flatMap((r) => r.events.flatMap((e: any) => e.markets || []));
  const allMarkets = [
    ...resultsList.flatMap((r) => r.markets || []),
    ...eventMarkets
  ];
  const uniqueMarkets = Array.from(new Map(allMarkets.map((m: any) => [m.conditionId, m])).values());

  return uniqueMarkets
    .filter((m: any) => m.active)
    .filter((m: any) => (m.liquidity || m.liquidityNum || 0) >= DEFAULT_CONFIG.minLiquidity)
    .sort((a: any, b: any) => (b.volume24hr || 0) - (a.volume24hr || 0))
    .slice(0, DEFAULT_CONFIG.maxMarketsPerKeyword) as GammaMarket[];
}

async function runCycle() {
  const now = Date.now();
  lastRunAt = now;

  const keywordMarkets = await mapWithConcurrency(
    keywords,
    DEFAULT_CONFIG.concurrency,
    async (keyword) => ({ keyword, markets: await fetchKeywordMarkets(keyword) })
  );

  const tasks: Array<{ keyword: string; market: GammaMarket }> = [];
  keywordMarkets.forEach(({ keyword, markets }) => {
    markets.forEach((market) => tasks.push({ keyword, market }));
  });

  await mapWithConcurrency(tasks, DEFAULT_CONFIG.concurrency, async ({ keyword, market }) => {
    const books = await clobApi.getMarketOrderbook(market.conditionId);
    if (!books?.yes || !books?.no) return;

    const processed = processOrderbook(books.yes, books.no);
    const snapshot: OrderbookSnapshot = {
      timestamp: now,
      bidDepth: processed.summary.totalBidDepth || 0,
      askDepth: processed.summary.totalAskDepth || 0,
      largestBid: Math.max(processed.yes.bidSize || 0, processed.no.bidSize || 0),
      largestAsk: Math.max(processed.yes.askSize || 0, processed.no.askSize || 0),
      imbalanceRatio: processed.summary.imbalanceRatio || 1,
    };

    const prev = snapshots.get(market.conditionId);
    snapshots.set(market.conditionId, snapshot);

    if (prev) {
      const movement = detectMovement(prev, snapshot);
      if (movement.hasMovement && shouldAlert(market.conditionId, now)) {
        const alert: FuturesAlert = {
          id: `${market.conditionId}-${now}`,
          timestamp: now,
          conditionId: market.conditionId,
          question: market.question,
          keyword,
          type: 'movement',
          severity: 'medium',
          message: movement.changes.join(', ') || 'Significant orderbook movement',
          details: movement,
        };
        pushAlert(alert);
        await sendAlert(alert);
      }
    }

    const insider = detectInsiderTrading(processed, market.volume24hr || 0);
    if (insider.isInsider && shouldAlert(`${market.conditionId}:insider`, now)) {
      const alert: FuturesAlert = {
        id: `${market.conditionId}-insider-${now}`,
        timestamp: now,
        conditionId: market.conditionId,
        question: market.question,
        keyword,
        type: 'insider',
        severity: insider.confidence === 'high' ? 'high' : insider.confidence === 'medium' ? 'medium' : 'low',
        message: insider.signals.join('; ') || 'Insider signal detected',
        details: insider,
      };
      pushAlert(alert);
      await sendAlert(alert);
    }
  });
}

export async function startFuturesMonitor(options?: { keywords?: string[]; intervalMs?: number }) {
  if (running) return;
  running = true;
  if (options?.keywords && options.keywords.length > 0) keywords = options.keywords;
  if (options?.intervalMs && options.intervalMs >= 10_000) intervalMs = options.intervalMs;

  await buildRewriteCache(keywords);
  await runCycle();
  intervalHandle = setInterval(runCycle, intervalMs);
}

export function stopFuturesMonitor() {
  running = false;
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export function getFuturesMonitorStatus(): FuturesMonitorStatus {
  return {
    running,
    intervalMs,
    keywords,
    lastRunAt,
    alertsCount: alerts.length,
  };
}

export function getFuturesAlerts(limit: number = 50) {
  return alerts.slice(-limit).reverse();
}

export function getDefaultKeywords() {
  return [...DEFAULT_KEYWORDS];
}

export async function refreshRewriteCache() {
  return buildRewriteCache(keywords);
}
