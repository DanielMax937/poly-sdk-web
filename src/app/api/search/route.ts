import { NextRequest, NextResponse } from 'next/server';
import { gammaApi, clobApi, processOrderbook, detectInsiderTrading, type InsiderDetection } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

/**
 * Search API - Find markets and events by keyword with insider trader detection
 *
 * Query params:
 * - q: Search query (required) - e.g., "gold", "oil", "bitcoin"
 * - limit: Maximum number of results to return (default: 20)
 * - minLiquidity: Minimum liquidity threshold to filter out low quality markets (default: 1000)
 * - checkInsider: Enable insider trader detection (default: true)
 * - insiderTimeout: Max time to wait for insider checks in ms (default: 5000)
 *
 * Example:
 *   GET /api/search?q=gold&limit=10&minLiquidity=5000
 *
 * Returns:
 *   {
 *     markets: GammaMarket[], // Each with insiderDetection field added, sorted by liquidity desc
 *     events: GammaEvent[],
 *     query: string
 *   }
 */

// Type for market with insider detection
type MarketWithInsider = {
    [K in keyof typeof gammaApi]?: any;
} & {
    insiderDetection?: InsiderDetection;
};

async function checkInsiderSignal(conditionId: string, volume24hr?: number): Promise<InsiderDetection | null> {
    try {
        const books = await clobApi.getMarketOrderbook(conditionId);
        if (!books || !books.yes || !books.no) {
            return null;
        }
        const processed = processOrderbook(books.yes, books.no);
        return detectInsiderTrading(processed, volume24hr);
    } catch (error) {
        console.error(`Insider check failed for ${conditionId}:`, error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minLiquidity = parseInt(searchParams.get('minLiquidity') || '1000');
    const checkInsider = searchParams.get('checkInsider') !== 'false';
    const insiderTimeout = parseInt(searchParams.get('insiderTimeout') || '5000');

    // Validate query parameter
    if (!query || query.trim().length === 0) {
        return NextResponse.json(
            { error: 'Query parameter "q" is required' },
            { status: 400 }
        );
    }

    try {
        const results = await gammaApi.search(query);

        // Extract markets from events (Polymarket API nests markets inside events)
        const eventMarkets = results.events.flatMap((e: any) => e.markets || []);

        // Combine direct markets and event markets, deduplicate by conditionId
        const allMarkets = [...results.markets, ...eventMarkets];
        const uniqueMarkets = Array.from(
            new Map(allMarkets.map((m: any) => [m.conditionId, m])).values()
        );

        // Filter to only active markets with minimum liquidity
        const activeMarkets = uniqueMarkets
            .filter((m: any) => m.active)
            .filter((m: any) => (m.liquidity || m.liquidityNum || 0) >= minLiquidity);

        const activeEvents = results.events.filter((e: any) => e.active);

        // Sort markets by liquidity (descending)
        const sortedMarkets = activeMarkets.sort((a: any, b: any) => {
            const liquidityA = a.liquidity || a.liquidityNum || 0;
            const liquidityB = b.liquidity || b.liquidityNum || 0;
            return liquidityB - liquidityA;
        });

        // Apply limit to results
        const limitedMarkets = sortedMarkets.slice(0, limit);
        const limitedEvents = activeEvents.slice(0, limit);

        // Check for insider trading signals on each market
        let marketsWithInsiderCheck = limitedMarkets;
        if (checkInsider && limitedMarkets.length > 0) {
            // Create a timeout promise for insider checks
            const timeoutPromise = new Promise<typeof limitedMarkets>((resolve) => {
                setTimeout(() => resolve(limitedMarkets.map((m: any) => ({
                    ...m,
                    insiderDetection: {
                        isInsider: false,
                        signals: ['Timeout'],
                        confidence: 'low' as const,
                        details: {
                            largeBidOrder: false,
                            largeAskOrder: false,
                            orderImbalance: false,
                            thinOrderBook: false,
                            aggressiveBidding: false
                        }
                    }
                }))), insiderTimeout);
            });

            // Fetch insider data for all markets in parallel
            const insiderPromise = Promise.all(
                limitedMarkets.map(async (market: any) => {
                    const detection = await checkInsiderSignal(market.conditionId, market.volume24hr);
                    return {
                        ...market,
                        insiderDetection: detection || {
                            isInsider: false,
                            signals: [],
                            confidence: 'low' as const,
                            details: {
                                largeBidOrder: false,
                                largeAskOrder: false,
                                orderImbalance: false,
                                thinOrderBook: false,
                                aggressiveBidding: false
                            }
                        },
                    };
                })
            );

            // Race between timeout and actual checks
            marketsWithInsiderCheck = await Promise.race([insiderPromise, timeoutPromise]);
        }

        return NextResponse.json({
            markets: marketsWithInsiderCheck,
            events: limitedEvents,
            query,
            counts: {
                markets: limitedMarkets.length,
                events: limitedEvents.length,
                totalMarkets: activeMarkets.length,
                totalEvents: activeEvents.length,
                filteredMarkets: allMarkets.length - activeMarkets.length,
                filteredEvents: results.events.length - activeEvents.length,
                filteredByLiquidity: uniqueMarkets.filter((m: any) => m.active).length - activeMarkets.length,
                insiderDetected: marketsWithInsiderCheck.filter((m: any) => m.insiderDetection?.isInsider).length,
            }
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        );
    }
}
