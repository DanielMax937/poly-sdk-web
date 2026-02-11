/**
 * Direct API client for Polymarket
 * Uses the APIs directly instead of the poly-sdk package
 * 
 * API Endpoints:
 * - Gamma API: https://gamma-api.polymarket.com (markets, events, tags, search)
 * - Data API: https://data-api.polymarket.com (positions, trades, leaderboard)
 * - CLOB API: https://clob.polymarket.com (orderbook, trading)
 */

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const DATA_API_BASE = 'https://data-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

import { proxyFetch } from './proxy-fetch';

// Types
export interface GammaMarket {
  id: string;
  conditionId: string;
  questionID: string;
  question: string;
  slug: string;
  volume: number;
  volumeNum: number;
  volume24hr: number;
  liquidity: number;
  liquidityNum: number;
  startDate: string;
  endDate: string;
  outcomes: string[];
  outcomePrices: string[];
  clobTokenIds?: string[];
  active: boolean;
  closed: boolean;
  archived: boolean;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  archived: boolean;
  markets: GammaMarket[];
}

export interface GammaTag {
  id: string;
  label: string;
  slug: string;
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

// Helper to parse JSON string fields from API
function parseJsonString<T>(value: unknown, defaultValue: T): T {
  if (!value) return defaultValue;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}

// Gamma API Client
export const gammaApi = {
  /**
   * Check API health status
   */
  async checkStatus(): Promise<boolean> {
    try {
      const res = await proxyFetch(`${GAMMA_API_BASE}/status`);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get trending markets sorted by 24h volume
   */
  async getTrendingMarkets(limit = 20): Promise<GammaMarket[]> {
    const url = `${GAMMA_API_BASE}/markets?limit=${limit}&active=true&closed=false&order=volume24hr&ascending=false`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((m: Record<string, unknown>) => normalizeGammaMarket(m));
  },

  /**
   * Get markets with custom filters
   */
  async getMarkets(params: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
    order?: string;
    ascending?: boolean;
    tag_slug?: string;
  } = {}): Promise<GammaMarket[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.active !== undefined) queryParams.set('active', String(params.active));
    if (params.closed !== undefined) queryParams.set('closed', String(params.closed));
    if (params.order) queryParams.set('order', params.order);
    if (params.ascending !== undefined) queryParams.set('ascending', String(params.ascending));
    if (params.tag_slug) queryParams.set('tag_slug', params.tag_slug);

    const url = `${GAMMA_API_BASE}/markets?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((m: Record<string, unknown>) => normalizeGammaMarket(m));
  },

  /**
   * Get market by ID
   */
  async getMarketById(id: string): Promise<GammaMarket | null> {
    const url = `${GAMMA_API_BASE}/markets/${id}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Gamma API error: ${res.status}`);
    }
    const data = await res.json();
    return normalizeGammaMarket(data);
  },

  /**
   * Get market by condition ID (query parameter)
   */
  async getMarketByConditionId(conditionId: string): Promise<GammaMarket | null> {
    const url = `${GAMMA_API_BASE}/markets?condition_id=${conditionId}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return data.length > 0 ? normalizeGammaMarket(data[0]) : null;
  },

  /**
   * Get market by slug
   */
  async getMarketBySlug(slug: string): Promise<GammaMarket | null> {
    const url = `${GAMMA_API_BASE}/markets?slug=${slug}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return data.length > 0 ? normalizeGammaMarket(data[0]) : null;
  },

  /**
   * Get event by slug
   */
  async getEventBySlug(slug: string): Promise<GammaEvent | null> {
    const url = `${GAMMA_API_BASE}/events?slug=${slug}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    if (data.length === 0) return null;

    const event = data[0];
    return {
      id: String(event.id || ''),
      slug: String(event.slug || ''),
      title: String(event.title || ''),
      description: String(event.description || ''),
      startDate: String(event.startDate || ''),
      endDate: String(event.endDate || ''),
      image: String(event.image || ''),
      icon: String(event.icon || ''),
      active: Boolean(event.active),
      closed: Boolean(event.closed),
      archived: Boolean(event.archived),
      volume: Number(event.volume || 0),
      volume24hr: Number(event.volume24hr || 0),
      liquidity: Number(event.liquidity || 0),
      markets: (event.markets || []).map((m: any) => normalizeGammaMarket(m)),
    };
  },

  /**
   * Get event by ID
   */
  async getEventById(id: string): Promise<GammaEvent | null> {
    const url = `${GAMMA_API_BASE}/events/${id}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Gamma API error: ${res.status}`);
    }
    const event = await res.json();

    return {
      id: String(event.id || ''),
      slug: String(event.slug || ''),
      title: String(event.title || ''),
      description: String(event.description || ''),
      startDate: String(event.startDate || ''),
      endDate: String(event.endDate || ''),
      image: String(event.image || ''),
      icon: String(event.icon || ''),
      active: Boolean(event.active),
      closed: Boolean(event.closed),
      archived: Boolean(event.archived),
      volume: Number(event.volume || 0),
      volume24hr: Number(event.volume24hr || 0),
      liquidity: Number(event.liquidity || 0),
      markets: (event.markets || []).map((m: any) => normalizeGammaMarket(m)),
    };
  },

  /**
   * Get events (contains markets)
   */
  async getEvents(params: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
    order?: string;
    ascending?: boolean;
  } = {}): Promise<GammaEvent[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.active !== undefined) queryParams.set('active', String(params.active));
    if (params.closed !== undefined) queryParams.set('closed', String(params.closed));
    if (params.order) queryParams.set('order', params.order);
    if (params.ascending !== undefined) queryParams.set('ascending', String(params.ascending));

    const url = `${GAMMA_API_BASE}/events?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((e: Record<string, unknown>) => normalizeGammaEvent(e));
  },

  /**
   * Get all tags
   */
  async getTags(params: { limit?: number; offset?: number } = {}): Promise<GammaTag[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));

    const url = `${GAMMA_API_BASE}/tags?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((t: Record<string, unknown>) => ({
      id: String(t.id || ''),
      label: String(t.label || ''),
      slug: String(t.slug || ''),
    }));
  },

  /**
   * Search markets, events, and profiles
   */
  async search(query: string): Promise<{
    markets: GammaMarket[];
    events: GammaEvent[];
  }> {
    const url = `${GAMMA_API_BASE}/public-search?q=${encodeURIComponent(query)}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
    const data = await res.json();
    return {
      markets: (data.markets || []).map((m: Record<string, unknown>) => normalizeGammaMarket(m)),
      events: (data.events || []).map((e: Record<string, unknown>) => normalizeGammaEvent(e)),
    };
  },
};

function normalizeGammaMarket(m: Record<string, unknown>): GammaMarket {
  // Parse JSON string fields
  const outcomes = parseJsonString<string[]>(m.outcomes, ['Yes', 'No']);
  const outcomePrices = parseJsonString<string[]>(m.outcomePrices, ['0.5', '0.5']);

  // Try multiple possible field names for clobTokenIds (both camelCase and snake_case)
  const clobTokenIds = parseJsonString<string[] | undefined>(
    m.clobTokenIds || m.clob_token_ids,
    undefined
  );

  return {
    id: String(m.id || ''),
    conditionId: String(m.conditionId || m.condition_id || ''),
    questionID: String(m.questionID || m.question_id || ''),
    question: String(m.question || ''),
    slug: String(m.slug || ''),
    volume: Number(m.volume || m.volumeNum || 0),
    volumeNum: Number(m.volumeNum || m.volume || 0),
    volume24hr: Number(m.volume24hr || 0),
    liquidity: Number(m.liquidity || m.liquidityNum || 0),
    liquidityNum: Number(m.liquidityNum || m.liquidity || 0),
    startDate: String(m.startDate || m.startDateIso || ''),
    endDate: String(m.endDate || m.endDateIso || ''),
    outcomes,
    outcomePrices,
    clobTokenIds,
    active: Boolean(m.active),
    closed: Boolean(m.closed),
    archived: Boolean(m.archived),
    bestBid: m.bestBid !== undefined ? Number(m.bestBid) : undefined,
    bestAsk: m.bestAsk !== undefined ? Number(m.bestAsk) : undefined,
    spread: m.spread !== undefined ? Number(m.spread) : undefined,
  };
}

function normalizeGammaEvent(e: Record<string, unknown>): GammaEvent {
  const marketsRaw = e.markets as Record<string, unknown>[] || [];

  return {
    id: String(e.id || ''),
    slug: String(e.slug || ''),
    title: String(e.title || ''),
    description: String(e.description || ''),
    startDate: String(e.startDate || ''),
    endDate: String(e.endDate || ''),
    image: String(e.image || ''),
    icon: String(e.icon || ''),
    volume: Number(e.volume || 0),
    volume24hr: Number(e.volume24hr || 0),
    liquidity: Number(e.liquidity || 0),
    active: Boolean(e.active),
    closed: Boolean(e.closed),
    archived: Boolean(e.archived),
    markets: marketsRaw.map((m) => normalizeGammaMarket(m)),
  };
}

// Data API Client
export interface DataPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  outcome: string;
  outcomeIndex: number;
  negativeRisk: boolean;
}

export interface Activity {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION' | 'MAKER_REBATE';
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: 'BUY' | 'SELL';
  outcomeIndex: number;
  title: string;
  slug: string;
  outcome: string;
}

export interface DataHolder {
  proxyWallet: string;
  amount: number;
  name?: string;
  pseudonym?: string;
  profileImage?: string;
  outcomeIndex: number;
}

export interface HoldingsValue {
  user: string;
  value: number;
}

export const dataApi = {
  /**
   * Get leaderboard
   */
  async getLeaderboard(params: { limit?: number; timePeriod?: string } = {}): Promise<{ entries: LeaderboardEntry[] }> {
    const { limit = 10, timePeriod = 'ALL' } = params;

    // Map timePeriod to API format (DAY, WEEK, MONTH, ALL)
    const period = timePeriod.toUpperCase();

    // Use v1 endpoint with correct parameters
    const url = `${DATA_API_BASE}/v1/leaderboard?category=OVERALL&timePeriod=${period}&orderBy=PNL&limit=${limit}`;
    const res = await proxyFetch(url, { next: { revalidate: 300 } });
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

  /**
   * Get user positions
   */
  async getPositions(address: string, params: {
    market?: string;
    eventId?: string;
    sizeThreshold?: number;
    redeemable?: boolean;
    mergeable?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'CURRENT' | 'INITIAL' | 'TOKENS' | 'CASHPNL' | 'PERCENTPNL' | 'TITLE' | 'RESOLVING' | 'PRICE' | 'AVGPRICE';
    sortDirection?: 'ASC' | 'DESC';
  } = {}): Promise<DataPosition[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('user', address);
    if (params.market) queryParams.set('market', params.market);
    if (params.eventId) queryParams.set('eventId', params.eventId);
    if (params.sizeThreshold !== undefined) queryParams.set('sizeThreshold', String(params.sizeThreshold));
    if (params.redeemable !== undefined) queryParams.set('redeemable', String(params.redeemable));
    if (params.mergeable !== undefined) queryParams.set('mergeable', String(params.mergeable));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.set('sortDirection', params.sortDirection);

    const url = `${DATA_API_BASE}/positions?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    return (data || []).map((p: Record<string, unknown>) => ({
      proxyWallet: String(p.proxyWallet || ''),
      asset: String(p.asset || ''),
      conditionId: String(p.conditionId || ''),
      size: Number(p.size || 0),
      avgPrice: Number(p.avgPrice || 0),
      initialValue: Number(p.initialValue || 0),
      currentValue: Number(p.currentValue || 0),
      cashPnl: Number(p.cashPnl || 0),
      percentPnl: Number(p.percentPnl || 0),
      realizedPnl: Number(p.realizedPnl || 0),
      percentRealizedPnl: Number(p.percentRealizedPnl || 0),
      curPrice: Number(p.curPrice || 0),
      redeemable: Boolean(p.redeemable),
      mergeable: Boolean(p.mergeable),
      title: String(p.title || ''),
      slug: String(p.slug || ''),
      outcome: String(p.outcome || ''),
      outcomeIndex: Number(p.outcomeIndex || 0),
      negativeRisk: Boolean(p.negativeRisk),
    }));
  },

  /**
   * Get user on-chain activity
   */
  async getActivity(address: string, params: {
    market?: string;
    eventId?: string;
    type?: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION' | 'MAKER_REBATE';
    side?: 'BUY' | 'SELL';
    start?: number;
    end?: number;
    limit?: number;
    offset?: number;
    sortBy?: 'TIMESTAMP' | 'TOKENS' | 'CASH';
    sortDirection?: 'ASC' | 'DESC';
  } = {}): Promise<Activity[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('user', address);
    if (params.market) queryParams.set('market', params.market);
    if (params.eventId) queryParams.set('eventId', params.eventId);
    if (params.type) queryParams.set('type', params.type);
    if (params.side) queryParams.set('side', params.side);
    if (params.start) queryParams.set('start', String(params.start));
    if (params.end) queryParams.set('end', String(params.end));
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.set('sortDirection', params.sortDirection);

    const url = `${DATA_API_BASE}/activity?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    return (data || []).map((a: Record<string, unknown>) => ({
      proxyWallet: String(a.proxyWallet || ''),
      timestamp: Number(a.timestamp || 0),
      conditionId: String(a.conditionId || ''),
      type: (a.type || 'TRADE') as Activity['type'],
      size: Number(a.size || 0),
      usdcSize: Number(a.usdcSize || 0),
      transactionHash: String(a.transactionHash || ''),
      price: Number(a.price || 0),
      asset: String(a.asset || ''),
      side: (a.side || 'BUY') as 'BUY' | 'SELL',
      outcomeIndex: Number(a.outcomeIndex || 0),
      title: String(a.title || ''),
      slug: String(a.slug || ''),
      outcome: String(a.outcome || ''),
    }));
  },

  /**
   * Get top holders of a market
   */
  async getHolders(conditionId: string, params: {
    limit?: number;
    minBalance?: number;
  } = {}): Promise<{ token: string; holders: DataHolder[] }[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('market', conditionId);
    if (params.limit) queryParams.set('limit', String(Math.min(params.limit, 20)));
    if (params.minBalance) queryParams.set('minBalance', String(params.minBalance));

    const url = `${DATA_API_BASE}/holders?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    return (data || []).map((item: Record<string, unknown>) => ({
      token: String(item.token || ''),
      holders: ((item.holders as Record<string, unknown>[]) || []).map((h) => ({
        proxyWallet: String(h.proxyWallet || ''),
        amount: Number(h.amount || 0),
        name: h.name as string | undefined,
        pseudonym: h.pseudonym as string | undefined,
        profileImage: h.profileImage as string | undefined,
        outcomeIndex: Number(h.outcomeIndex || 0),
      })),
    }));
  },

  /**
   * Get total holdings value for a user
   */
  async getHoldingsValue(address: string, market?: string): Promise<HoldingsValue[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('user', address);
    if (market) queryParams.set('market', market);

    const url = `${DATA_API_BASE}/value?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();

    return (data || []).map((v: Record<string, unknown>) => ({
      user: String(v.user || ''),
      value: Number(v.value || 0),
    }));
  },

  /**
   * Get trades (deprecated - use CLOB API instead)
   */
  async getTrades(params: { limit?: number } = {}): Promise<Trade[]> {
    const { limit = 100 } = params;
    const url = `${DATA_API_BASE}/trades?limit=${limit}`;
    const res = await proxyFetch(url, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`Data API error: ${res.status}`);
    const data = await res.json();
    return normalizeTrades(data.trades || data || []);
  },

  /**
   * Get trades by market (deprecated - use CLOB API instead)
   */
  async getTradesByMarket(conditionId: string, limit = 500): Promise<Trade[]> {
    const url = `${DATA_API_BASE}/trades?market=${conditionId}&limit=${limit}`;
    const res = await proxyFetch(url, { next: { revalidate: 30 } });
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
export interface PriceHistoryPoint {
  t: number; // Unix timestamp
  p: number; // Price
}

export interface ClobMarketInfo {
  condition_id: string;
  question_id: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
  }>;
  active: boolean;
  closed: boolean;
  accepting_orders: boolean;
  minimum_tick_size: number;
  minimum_order_size: number;
}

export const clobApi = {
  /**
   * Get order book for a token
   */
  async getOrderbook(tokenId: string): Promise<Orderbook> {
    const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
    const res = await proxyFetch(url, { next: { revalidate: 10 } });
    if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
    return res.json();
  },

  /**
   * Get order book for both outcomes of a market
   */
  async getMarketOrderbook(conditionId: string): Promise<{ yes: Orderbook; no: Orderbook } | null> {
    // First get market info to get token IDs
    const market = await gammaApi.getMarketByConditionId(conditionId);
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

  /**
   * Get price history for a token
   */
  async getPriceHistory(params: {
    tokenId: string;
    startTs?: number;
    endTs?: number;
    interval?: '1m' | '1h' | '6h' | '1d' | '1w' | 'max';
    fidelity?: number; // Resolution in minutes
  }): Promise<{ history: PriceHistoryPoint[] }> {
    const queryParams = new URLSearchParams();
    queryParams.set('market', params.tokenId);
    if (params.startTs) queryParams.set('startTs', String(params.startTs));
    if (params.endTs) queryParams.set('endTs', String(params.endTs));
    if (params.interval) queryParams.set('interval', params.interval);
    if (params.fidelity) queryParams.set('fidelity', String(params.fidelity));

    const url = `${CLOB_API_BASE}/prices-history?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
    return res.json();
  },

  /**
   * Get trades from CLOB
   */
  async getTrades(params: {
    market?: string;
    makerAddress?: string;
  } = {}): Promise<Trade[]> {
    const queryParams = new URLSearchParams();
    if (params.market) queryParams.set('market', params.market);
    if (params.makerAddress) queryParams.set('maker_address', params.makerAddress);

    const url = `${CLOB_API_BASE}/data/trades?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
    const data = await res.json();
    return normalizeTrades(data.trades || data || []);
  },

  /**
   * Get bid-ask spreads for multiple tokens
   */
  async getSpreads(tokenIds: string[], side?: 'BUY' | 'SELL'): Promise<Record<string, string>> {
    const body = tokenIds.map(token_id => ({
      token_id,
      ...(side && { side }),
    }));

    const res = await proxyFetch(`${CLOB_API_BASE}/spreads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: 10 },
    });
    if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
    return res.json();
  },

  /**
   * Get CLOB market info
   */
  async getMarketInfo(conditionId: string): Promise<ClobMarketInfo | null> {
    const url = `${CLOB_API_BASE}/markets/${conditionId}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`CLOB API error: ${res.status}`);
    }
    return res.json();
  },

  /**
   * List all CLOB markets
   */
  async getMarkets(params: {
    nextCursor?: string;
  } = {}): Promise<{ data: ClobMarketInfo[]; next_cursor?: string }> {
    const queryParams = new URLSearchParams();
    if (params.nextCursor) queryParams.set('next_cursor', params.nextCursor);

    const url = `${CLOB_API_BASE}/markets?${queryParams.toString()}`;
    const res = await proxyFetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`CLOB API error: ${res.status}`);
    return res.json();
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

// Insider trader detection - looks for unusual orderbook patterns
export interface InsiderDetection {
  isInsider: boolean;
  signals: string[];
  confidence: 'low' | 'medium' | 'high';
  details: {
    largeBidOrder: boolean;
    largeAskOrder: boolean;
    orderImbalance: boolean;
    thinOrderBook: boolean;
    aggressiveBidding: boolean;
    largestBidSize?: number;
    largestAskSize?: number;
    imbalanceRatio?: number;
    bidDepth?: number;
    askDepth?: number;
  };
}

export function detectInsiderTrading(
  processedOrderbook: ReturnType<typeof processOrderbook>,
  marketVolume24hr?: number
): InsiderDetection {
  const signals: string[] = [];
  const { yes, no, summary } = processedOrderbook;

  // Find largest orders
  const largestBidSize = Math.max(yes.bidSize, no.bidSize);
  const largestAskSize = Math.max(yes.askSize, no.askSize);

  // Thresholds based on market size
  const sizeThreshold = marketVolume24hr && marketVolume24hr > 0
    ? Math.max(1000, marketVolume24hr * 0.01) // 1% of daily volume or $1000 min
    : 500; // $500 default for unknown markets

  const depthThreshold = marketVolume24hr && marketVolume24hr > 0
    ? Math.max(5000, marketVolume24hr * 0.05) // 5% of daily volume
    : 2000;

  // Signal 1: Large single bid order (potential insider accumulation)
  const largeBidOrder = largestBidSize > sizeThreshold;
  if (largeBidOrder) {
    signals.push(`Large bid order: $${largestBidSize.toFixed(0)} (threshold: $${sizeThreshold.toFixed(0)})`);
  }

  // Signal 2: Large ask order (potential insider dumping)
  const largeAskOrder = largestAskSize > sizeThreshold;
  if (largeAskOrder) {
    signals.push(`Large ask order: $${largestAskSize.toFixed(0)} (threshold: $${sizeThreshold.toFixed(0)})`);
  }

  // Signal 3: Severe order imbalance (one-sided betting)
  const imbalanceRatio = summary.imbalanceRatio;
  const orderImbalance = imbalanceRatio > 2.5 || imbalanceRatio < 0.4;
  if (orderImbalance) {
    signals.push(`Order imbalance: ${imbalanceRatio.toFixed(2)}x (${imbalanceRatio > 1 ? 'bid-heavy' : 'ask-heavy'})`);
  }

  // Signal 4: Thin order book with large orders (easier to manipulate)
  const thinOrderBook = summary.totalBidDepth < depthThreshold || summary.totalAskDepth < depthThreshold;
  if (thinOrderBook && (largeBidOrder || largeAskOrder)) {
    signals.push(`Thin orderbook: bid depth $${summary.totalBidDepth.toFixed(0)}, ask depth $${summary.totalAskDepth.toFixed(0)}`);
  }

  // Signal 5: Aggressive bidding (bids much closer to current price than asks)
  const yesSpread = yes.spread;
  const noSpread = no.spread;
  const avgSpread = (yesSpread + noSpread) / 2;
  const aggressiveBidding = avgSpread < 0.01 && (largeBidOrder || orderImbalance);
  if (aggressiveBidding) {
    signals.push(`Aggressive bidding: tight spread (${(avgSpread * 100).toFixed(2)}%) with large orders`);
  }

  // Calculate confidence based on number and severity of signals
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (signals.length >= 3) confidence = 'high';
  else if (signals.length >= 2) confidence = 'medium';

  // High confidence overrides
  if (largeBidOrder && thinOrderBook && imbalanceRatio > 3) confidence = 'high';

  const isInsider = signals.length >= 2 || (signals.length >= 1 && confidence === 'high');

  return {
    isInsider,
    signals,
    confidence,
    details: {
      largeBidOrder,
      largeAskOrder,
      orderImbalance,
      thinOrderBook,
      aggressiveBidding,
      largestBidSize: largestBidSize || undefined,
      largestAskSize: largestAskSize || undefined,
      imbalanceRatio,
      bidDepth: summary.totalBidDepth,
      askDepth: summary.totalAskDepth,
    },
  };
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
    market = await gammaApi.getMarketByConditionId(identifier);
  } else {
    market = await gammaApi.getMarketBySlug(identifier);
  }

  if (!market) return null;

  const prices = market.outcomePrices.map((p) => parseFloat(p));

  return {
    conditionId: market.conditionId,
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

// ============================================================================
// Batch API Helpers - Reduce call volume for better performance
// ============================================================================

/**
 * Batch result type for parallel requests with individual error handling
 */
export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch multiple markets by condition IDs in a single batch
 * Uses the Gamma API's batch query support when available
 */
export async function batchGetMarketsByConditionIds(
  conditionIds: string[]
): Promise<BatchResult<GammaMarket>[]> {
  // Gamma API supports querying multiple markets via comma-separated condition_id
  // But there's a URL length limit, so we batch in groups of 50
  const BATCH_SIZE = 50;
  const results: BatchResult<GammaMarket>[] = [];

  for (let i = 0; i < conditionIds.length; i += BATCH_SIZE) {
    const batch = conditionIds.slice(i, i + BATCH_SIZE);
    const queryParams = batch.map(id => `condition_id=${id}`).join('&');
    const url = `${GAMMA_API_BASE}/markets?${queryParams}`;

    try {
      const res = await proxyFetch(url);
      if (!res.ok) {
        // Mark all in this batch as failed
        batch.forEach(() => {
          results.push({ success: false, error: `HTTP ${res.status}` });
        });
        continue;
      }

      const data = await res.json();
      const markets = (data || []) as Record<string, unknown>[];
      const marketMap = new Map<string, GammaMarket>();

      markets.forEach((m: Record<string, unknown>) => {
        const normalized = normalizeGammaMarket(m);
        marketMap.set(normalized.conditionId, normalized);
      });

      // Map results back to original order
      batch.forEach(conditionId => {
        const market = marketMap.get(conditionId);
        if (market) {
          results.push({ success: true, data: market });
        } else {
          results.push({ success: false, error: 'Market not found' });
        }
      });
    } catch (error) {
      batch.forEach(() => {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }
  }

  return results;
}

/**
 * Fetch multiple orderbooks in parallel with concurrency control
 * Limits concurrent requests to avoid overwhelming the API
 */
export async function batchGetOrderbooks(
  tokenIds: string[],
  concurrency: number = 3
): Promise<BatchResult<Orderbook>[]> {
  const results: Map<string, BatchResult<Orderbook>> = new Map();

  // Initialize all as pending
  tokenIds.forEach(id => results.set(id, { success: false, error: 'Pending' }));

  // Process in chunks to limit concurrency
  for (let i = 0; i < tokenIds.length; i += concurrency) {
    const chunk = tokenIds.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (tokenId) => {
        try {
          const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
          const res = await proxyFetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = await res.json() as Orderbook;
          return { tokenId, success: true, data };
        } catch (error) {
          return {
            tokenId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    chunkResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.set(result.value.tokenId, {
          success: result.value.success,
          data: result.value.data,
          error: result.value.error
        });
      }
    });
  }

  return tokenIds.map(id => results.get(id)!);
}

/**
 * Fetch market data with orderbooks in a single batch operation
 * Returns enriched market data with current prices from orderbooks
 */
export async function batchGetMarketsWithPrices(
  conditionIds: string[],
  options: { concurrency?: number } = {}
): Promise<BatchResult<(GammaMarket & { currentPrices?: { yes: number; no: number } })>[]> {
  const { concurrency = 3 } = options;

  // First, batch fetch all markets
  const marketResults = await batchGetMarketsByConditionIds(conditionIds);

  // Collect all token IDs for orderbook fetching
  const tokenIdsToFetch: Array<{ tokenId: string; marketIndex: number }> = [];
  const validMarkets: (GammaMarket & { currentPrices?: { yes: number; no: number } })[] = [];

  marketResults.forEach((result, index) => {
    if (result.success && result.data?.clobTokenIds) {
      validMarkets.push(result.data);
      result.data.clobTokenIds.forEach((tokenId, tokenIndex) => {
        tokenIdsToFetch.push({ tokenId, marketIndex: index });
      });
    } else {
      validMarkets.push(null as any); // Placeholder for failed markets
    }
  });

  // Fetch orderbooks in parallel with concurrency limit
  const flatTokenIds = tokenIdsToFetch.map(t => t.tokenId);
  const orderbookResults = await batchGetOrderbooks(flatTokenIds, concurrency);

  // Merge orderbook data back into markets
  tokenIdsToFetch.forEach(({ tokenId, marketIndex }, index) => {
    const orderbookResult = orderbookResults[index];
    if (orderbookResult.success && orderbookResult.data) {
      const book = orderbookResult.data;
      const market = validMarkets[marketIndex];
      if (market && !market.currentPrices) {
        market.currentPrices = { yes: 0, no: 0 };
      }
      if (market) {
        // First token is YES, second is NO
        const price = book.bids[0]?.price ? parseFloat(book.bids[0].price) : 0;
        if (index % 2 === 0) {
          market.currentPrices!.yes = price;
        } else {
          market.currentPrices!.no = price;
        }
      }
    }
  });

  return marketResults.map((result, index) => ({
    success: result.success,
    data: result.success ? validMarkets[index] : undefined,
    error: result.error,
  }));
}

/**
 * Get top markets by 24h volume with enriched orderbook data
 * A single efficient call that reduces API round trips
 */
export async function getTopMarketsWithOrderbooks(
  limit: number = 10,
  options: { concurrency?: number } = {}
): Promise<(GammaMarket & { orderbook?: ReturnType<typeof processOrderbook> })[]> {
  const { concurrency = 3 } = options;

  // Fetch trending markets (single API call)
  const markets = await gammaApi.getTrendingMarkets(limit);

  // Collect token IDs for markets that have them
  const marketsWithTokens = markets.filter(m => m.clobTokenIds && m.clobTokenIds.length >= 2);
  const tokenIds = marketsWithTokens.flatMap(m => m.clobTokenIds!.slice(0, 2));

  // Batch fetch orderbooks
  const orderbookResults = await batchGetOrderbooks(tokenIds, concurrency);

  // Merge orderbook data back into markets
  const orderbookMap = new Map<string, Orderbook>();
  tokenIds.forEach((id, index) => {
    const result = orderbookResults[index];
    if (result.success && result.data) {
      orderbookMap.set(id, result.data);
    }
  });

  return markets.map(market => {
    if (!market.clobTokenIds || market.clobTokenIds.length < 2) {
      return market;
    }

    const yesTokenId = market.clobTokenIds[0];
    const noTokenId = market.clobTokenIds[1];
    const yesBook = orderbookMap.get(yesTokenId);
    const noBook = orderbookMap.get(noTokenId);

    if (yesBook && noBook) {
      return {
        ...market,
        orderbook: processOrderbook(yesBook, noBook),
      };
    }

    return market;
  });
}
