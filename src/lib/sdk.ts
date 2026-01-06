/**
 * Direct API client for Polymarket
 * Uses the APIs directly instead of the poly-sdk package
 * 
 * API Endpoints:
 * - Gamma API: https://gamma-api.polymarket.com (market discovery, events)
 * - Data API: https://data-api.polymarket.com (positions, trades, leaderboard)
 * - CLOB API: https://clob.polymarket.com (orderbook, trading)
 */

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const DATA_API_BASE = 'https://data-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

// Types
export interface GammaMarket {
  id: string;
  condition_id: string;
  question_id: string;
  question: string;
  slug: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds?: string[];
  active: boolean;
  closed: boolean;
  archived: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  pnl: number;
  volume: number;
  positions?: number;
  trades?: number;
  userName?: string;
  profileImage?: string;
}

export interface Position {
  conditionId: string;
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice?: number;
  cashPnl?: number;
  percentPnl?: number;
}

export interface Trade {
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: number;
  outcomeIndex: number;
  outcome: string;
  proxyWallet?: string;
}

export interface OrderbookLevel {
  price: string;
  size: string;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  hash: string;
  timestamp: string;
  market: string;
  asset_id: string;
}

// Gamma API Client
export const gammaApi = {
  async getTrendingMarkets(limit = 20): Promise<GammaMarket[]> {
    const url = `${GAMMA_API_BASE}/markets?limit=${limit}&active=true&closed=false&order=volume24hr&ascending=false`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return data.map((m: Record<string, unknown>) => normalizeGammaMarket(m));
  },

  async getMarket(conditionId: string): Promise<GammaMarket | null> {
    const url = `${GAMMA_API_BASE}/markets?condition_id=${conditionId}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return data.length > 0 ? normalizeGammaMarket(data[0]) : null;
  },

  async getMarketBySlug(slug: string): Promise<GammaMarket | null> {
    const url = `${GAMMA_API_BASE}/markets?slug=${slug}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return data.length > 0 ? normalizeGammaMarket(data[0]) : null;
  },
};

function normalizeGammaMarket(m: Record<string, unknown>): GammaMarket {
  const outcomePricesRaw = m.outcomePrices || m.outcome_prices || '["0.5", "0.5"]';
  let outcomePrices: string[];
  try {
    outcomePrices = typeof outcomePricesRaw === 'string'
      ? JSON.parse(outcomePricesRaw)
      : outcomePricesRaw as string[];
  } catch {
    outcomePrices = ['0.5', '0.5'];
  }

  const clobTokenIdsRaw = m.clobTokenIds || m.clob_token_ids;
  let clobTokenIds: string[] | undefined;
  if (clobTokenIdsRaw) {
    try {
      clobTokenIds = typeof clobTokenIdsRaw === 'string'
        ? JSON.parse(clobTokenIdsRaw)
        : clobTokenIdsRaw as string[];
    } catch {
      clobTokenIds = undefined;
    }
  }

  return {
    id: String(m.id || ''),
    condition_id: String(m.condition_id || m.conditionId || ''),
    question_id: String(m.question_id || m.questionId || ''),
    question: String(m.question || ''),
    slug: String(m.slug || ''),
    volume: Number(m.volume || 0),
    volume24hr: Number(m.volume24hr || m.volume_24hr || 0),
    liquidity: Number(m.liquidity || 0),
    startDate: String(m.startDate || m.start_date || ''),
    endDate: String(m.endDate || m.end_date || ''),
    outcomes: (m.outcomes as string[]) || ['Yes', 'No'],
    outcomePrices,
    clobTokenIds,
    active: Boolean(m.active),
    closed: Boolean(m.closed),
    archived: Boolean(m.archived),
  };
}

// Data API Client
export const dataApi = {
  async getLeaderboard(params: { limit?: number; timePeriod?: string } = {}): Promise<{ entries: LeaderboardEntry[] }> {
    const { limit = 10, timePeriod = 'ALL' } = params;
    const url = `${DATA_API_BASE}/leaderboard?limit=${limit}&window=${timePeriod.toLowerCase()}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    const entries: LeaderboardEntry[] = (data.leaderboard || data || []).map((entry: Record<string, unknown>, index: number) => ({
      rank: Number(entry.rank || index + 1),
      address: String(entry.address || entry.proxyWallet || ''),
      pnl: Number(entry.pnl || entry.profit || 0),
      volume: Number(entry.volume || 0),
      positions: Number(entry.positions || entry.positionCount || 0),
      trades: Number(entry.trades || entry.tradeCount || 0),
      userName: entry.userName as string | undefined,
      profileImage: entry.profileImage as string | undefined,
    }));

    return { entries };
  },

  async getPositions(address: string, params: { limit?: number } = {}): Promise<Position[]> {
    const { limit = 20 } = params;
    const url = `${DATA_API_BASE}/positions?user=${address}&limit=${limit}&sizeThreshold=0.1`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    return (data.positions || data || []).map((p: Record<string, unknown>) => ({
      conditionId: String(p.conditionId || p.condition_id || ''),
      title: String(p.title || p.question || ''),
      outcome: String(p.outcome || (p.outcomeIndex === 0 ? 'Yes' : 'No')),
      size: Number(p.size || 0),
      avgPrice: Number(p.avgPrice || p.avg_price || 0),
      curPrice: Number(p.curPrice || p.current_price) || undefined,
      cashPnl: Number(p.cashPnl || p.pnl) || undefined,
      percentPnl: Number(p.percentPnl || p.percent_pnl) || undefined,
    }));
  },

  async getActivity(address: string, params: { limit?: number } = {}): Promise<Record<string, unknown>[]> {
    const { limit = 20 } = params;
    const url = `${DATA_API_BASE}/activity?user=${address}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    return (data.activity || data || []).map((a: Record<string, unknown>) => ({
      type: String(a.type || 'TRADE'),
      side: String(a.side || 'BUY'),
      size: Number(a.size || 0),
      price: Number(a.price || 0),
      usdcSize: Number(a.usdcSize || a.usdc_size) || undefined,
      outcome: String(a.outcome || ''),
      timestamp: Number(a.timestamp || Date.now()),
    }));
  },

  async getTrades(params: { limit?: number } = {}): Promise<Trade[]> {
    const { limit = 100 } = params;
    const url = `${DATA_API_BASE}/trades?limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();
    return normalizeTrades(data.trades || data || []);
  },

  async getTradesByMarket(conditionId: string, limit = 500): Promise<Trade[]> {
    const url = `${DATA_API_BASE}/trades?market=${conditionId}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();
    return normalizeTrades(data.trades || data || []);
  },
};

function normalizeTrades(trades: Record<string, unknown>[]): Trade[] {
  return trades.map((t) => ({
    price: Number(t.price || 0),
    size: Number(t.size || 0),
    side: (t.side === 'SELL' || t.side === 'sell' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
    timestamp: Number(t.timestamp || t.createdAt || Date.now()),
    outcomeIndex: Number(t.outcomeIndex ?? t.outcome_index ?? 0),
    outcome: String(t.outcome || (t.outcomeIndex === 0 ? 'Yes' : 'No')),
    proxyWallet: t.proxyWallet as string | undefined,
  }));
}

// CLOB API Client
export const clobApi = {
  async getOrderbook(tokenId: string): Promise<Orderbook> {
    const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
    const res = await fetch(url, { next: { revalidate: 10 } });
    if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
    return res.json();
  },

  async getMarketOrderbook(conditionId: string): Promise<{ yes: Orderbook; no: Orderbook } | null> {
    // First get market info to get token IDs
    const market = await gammaApi.getMarket(conditionId);
    if (!market?.clobTokenIds || market.clobTokenIds.length < 2) {
      return null;
    }

    const [yesTokenId, noTokenId] = market.clobTokenIds;
    const [yesBook, noBook] = await Promise.all([
      this.getOrderbook(yesTokenId),
      this.getOrderbook(noTokenId),
    ]);

    return { yes: yesBook, no: noBook };
  },
};

// Processed orderbook helper
export function processOrderbook(yesBook: Orderbook, noBook: Orderbook) {
  const yesBestBid = yesBook.bids[0] ? parseFloat(yesBook.bids[0].price) : 0;
  const yesBestAsk = yesBook.asks[0] ? parseFloat(yesBook.asks[0].price) : 1;
  const noBestBid = noBook.bids[0] ? parseFloat(noBook.bids[0].price) : 0;
  const noBestAsk = noBook.asks[0] ? parseFloat(noBook.asks[0].price) : 1;

  const yesBidSize = yesBook.bids[0] ? parseFloat(yesBook.bids[0].size) : 0;
  const yesAskSize = yesBook.asks[0] ? parseFloat(yesBook.asks[0].size) : 0;
  const noBidSize = noBook.bids[0] ? parseFloat(noBook.bids[0].size) : 0;
  const noAskSize = noBook.asks[0] ? parseFloat(noBook.asks[0].size) : 0;

  const askSum = yesBestAsk + noBestAsk;
  const bidSum = yesBestBid + noBestBid;
  const longArbProfit = askSum < 1 ? 1 - askSum : 0;
  const shortArbProfit = bidSum > 1 ? bidSum - 1 : 0;

  const totalBidDepth = [...yesBook.bids, ...noBook.bids].reduce(
    (sum, level) => sum + parseFloat(level.size) * parseFloat(level.price), 0
  );
  const totalAskDepth = [...yesBook.asks, ...noBook.asks].reduce(
    (sum, level) => sum + parseFloat(level.size) * parseFloat(level.price), 0
  );

  return {
    yes: {
      bid: yesBestBid,
      ask: yesBestAsk,
      bidSize: yesBidSize,
      askSize: yesAskSize,
      spread: yesBestAsk - yesBestBid,
    },
    no: {
      bid: noBestBid,
      ask: noBestAsk,
      bidSize: noBidSize,
      askSize: noAskSize,
      spread: noBestAsk - noBestBid,
    },
    summary: {
      askSum,
      bidSum,
      longArbProfit,
      shortArbProfit,
      totalBidDepth,
      totalAskDepth,
      imbalanceRatio: totalAskDepth > 0 ? totalBidDepth / totalAskDepth : 1,
    },
  };
}

// Arbitrage detection
export function detectArbitrage(processedOrderbook: ReturnType<typeof processOrderbook>, threshold = 0.001) {
  const { summary } = processedOrderbook;

  if (summary.longArbProfit > threshold) {
    return {
      type: 'long' as const,
      profit: summary.longArbProfit,
      action: `Buy YES @ ${processedOrderbook.yes.ask.toFixed(4)} + Buy NO @ ${processedOrderbook.no.ask.toFixed(4)} = ${summary.askSum.toFixed(4)}`,
    };
  }

  if (summary.shortArbProfit > threshold) {
    return {
      type: 'short' as const,
      profit: summary.shortArbProfit,
      action: `Sell YES @ ${processedOrderbook.yes.bid.toFixed(4)} + Sell NO @ ${processedOrderbook.no.bid.toFixed(4)} = ${summary.bidSum.toFixed(4)}`,
    };
  }

  return null;
}

// Unified market interface
export interface UnifiedMarket {
  conditionId: string;
  question: string;
  slug: string;
  volume: number;
  volume24hr: number;
  tokens: Array<{
    tokenId: string;
    outcome: string;
    price: number;
  }>;
  source: 'gamma' | 'mock';
}

export async function getUnifiedMarket(identifier: string): Promise<UnifiedMarket | null> {
  let market: GammaMarket | null = null;

  // Try by condition ID first, then by slug
  if (identifier.startsWith('0x')) {
    market = await gammaApi.getMarket(identifier);
  } else {
    market = await gammaApi.getMarketBySlug(identifier);
  }

  if (!market) return null;

  const prices = market.outcomePrices.map((p) => parseFloat(p));

  return {
    conditionId: market.condition_id,
    question: market.question,
    slug: market.slug,
    volume: market.volume,
    volume24hr: market.volume24hr,
    tokens: market.outcomes.map((outcome, i) => ({
      tokenId: market.clobTokenIds?.[i] || `token-${i}`,
      outcome,
      price: prices[i] || 0.5,
    })),
    source: 'gamma',
  };
}
