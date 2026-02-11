import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook, detectInsiderTrading, type InsiderDetection } from '@/lib/sdk';
import { proxyFetch } from '@/lib/proxy-fetch';

export const dynamic = 'force-dynamic';

/**
 * Trending Events API - Aggregates events from multiple categories
 *
 * Query params:
 * - limit: Maximum events per category (default: 10)
 * - checkInsider: Enable insider trader detection (default: true)
 * - insiderTimeout: Max time for insider checks in ms (default: 5000)
 * - categories: Comma-separated categories to fetch (default: all)
 *
 * Example:
 *   GET /api/trending-events?limit=5
 *
 * Returns:
 *   {
 *     events: SimplifiedEvent[],
 *     categories: string[],
 *     totalEvents: number,
 *     insiderDetected: number
 *   }
 */

// Categories to fetch events from
const CATEGORIES: Array<{ tag_id?: string; tag_slug?: string; offset: number; name: string }> = [
    { tag_id: '101031', offset: 0, name: 'Commodities' },  // Commodities tag
    { tag_slug: 'politics', offset: 0, name: 'Politics' },
    { tag_slug: 'politics', offset: 40, name: 'Politics More' },
    { tag_slug: 'world', offset: 0, name: 'World' },
    { tag_slug: 'world', offset: 20, name: 'World More' },
    { tag_slug: 'business', offset: 0, name: 'Business' },
    { tag_slug: 'economics', offset: 0, name: 'Economics' },
    { tag_slug: 'trading', offset: 0, name: 'Trading' },
];

interface SimplifiedEvent {
    id: string;
    slug: string;
    title: string;
    description: string;
    endDate: string;
    volume: number;
    volume24hr: number;
    liquidity: number;
    category: string;
    markets: SimplifiedMarket[];
}

interface SimplifiedMarket {
    id: string;
    conditionId: string;
    question: string;
    description: string;
    slug: string;
    endDate: string;
    outcomes: string[];
    outcomePrices: number[];  // [yesPrice, noPrice]
    volume: number;
    volume24hr: number;
    liquidity: number;
    active: boolean;
    closed: boolean;
    spread?: number;
    insiderDetection?: InsiderDetection;
}

// Fetch events from a specific category
async function fetchCategoryEvents(
    tag_id: string | undefined,
    tag_slug: string | undefined,
    offset: number,
    limit: number
): Promise<{ data: any[]; pagination?: any }> {
    const params = new URLSearchParams({
        limit: String(limit),
        active: 'true',
        archived: 'false',
        closed: 'false',
        order: 'volume24hr',
        ascending: 'false',
        offset: String(offset),
    });

    if (tag_id) params.set('tag_id', tag_id);
    if (tag_slug) params.set('tag_slug', tag_slug);

    const url = `https://gamma-api.polymarket.com/events/pagination?${params.toString()}`;

    try {
        const res = await proxyFetch(url);
        if (!res.ok) {
            console.error(`Failed to fetch events: ${res.status}`);
            return { data: [] };
        }
        return await res.json();
    } catch (error) {
        console.error(`Error fetching category events:`, error);
        return { data: [] };
    }
}

// Check insider signal for a market
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

// Simplify event data
function simplifyEvent(eventData: any, categoryName: string): SimplifiedEvent | null {
    if (!eventData.markets || eventData.markets.length === 0) {
        return null;
    }

    // Get the main market (first one)
    const mainMarket = eventData.markets[0];

    return {
        id: eventData.id,
        slug: eventData.slug,
        title: eventData.title,
        description: eventData.description || '',
        endDate: eventData.endDate,
        volume: eventData.volume || 0,
        volume24hr: eventData.volume24hr || 0,
        liquidity: eventData.liquidity || 0,
        category: categoryName,
        markets: eventData.markets.map((m: any) => {
            // Parse outcome prices
            let outcomePrices: number[] = [0.5, 0.5];
            try {
                const prices = typeof m.outcomePrices === 'string'
                    ? JSON.parse(m.outcomePrices)
                    : m.outcomePrices;
                outcomePrices = prices.map((p: any) => parseFloat(p) || 0.5);
            } catch {
                outcomePrices = m.outcomePrices
                    ? m.outcomePrices.map((p: any) => parseFloat(p) || 0.5)
                    : [0.5, 0.5];
            }

            // Parse outcomes
            let outcomes: string[] = ['Yes', 'No'];
            try {
                outcomes = typeof m.outcomes === 'string'
                    ? JSON.parse(m.outcomes)
                    : m.outcomes || ['Yes', 'No'];
            } catch {
                outcomes = ['Yes', 'No'];
            }

            return {
                id: m.id,
                conditionId: m.conditionId,
                question: m.question,
                description: m.description || '',
                slug: m.slug,
                endDate: m.endDate || eventData.endDate,
                outcomes,
                outcomePrices,
                volume: parseFloat(m.volume || m.volumeNum || 0),
                volume24hr: parseFloat(m.volume24hr || 0),
                liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
                active: m.active ?? true,
                closed: m.closed ?? false,
                spread: m.spread ? parseFloat(m.spread) : undefined,
            };
        }),
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');
    const checkInsider = searchParams.get('checkInsider') !== 'false';
    const insiderTimeout = parseInt(searchParams.get('insiderTimeout') || '5000');
    const categoriesParam = searchParams.get('categories');
    const maxEvents = parseInt(searchParams.get('maxEvents') || '50');

    // Filter categories if specified
    let categoriesToFetch = CATEGORIES;
    if (categoriesParam) {
        const requestedCategories = categoriesParam.split(',').map(c => c.trim().toLowerCase());
        categoriesToFetch = CATEGORIES.filter(cat =>
            requestedCategories.includes(cat.name.toLowerCase())
        );
    }

    try {
        // Fetch events from all categories in parallel
        const categoryPromises = categoriesToFetch.map(cat =>
            fetchCategoryEvents(cat.tag_id, cat.tag_slug, cat.offset, limit)
        );

        const categoryResults = await Promise.all(categoryPromises);

        // Flatten and simplify events
        const allEvents: SimplifiedEvent[] = [];
        const categoryMap = new Map<string, number>();

        categoryResults.forEach((result, index) => {
            const categoryName = categoriesToFetch[index].name;

            result.data.forEach((eventData: any) => {
                const simplified = simplifyEvent(eventData, categoryName);
                if (simplified) {
                    allEvents.push(simplified);
                    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
                }
            });
        });

        // Limit total events and sort by volume24hr
        const sortedEvents = allEvents
            .sort((a, b) => b.volume24hr - a.volume24hr)
            .slice(0, maxEvents);

        // Check for insider trading on all markets
        let eventsWithInsider = sortedEvents;
        let insiderDetectedCount = 0;

        if (checkInsider && sortedEvents.length > 0) {
            // Collect all markets to check
            const allMarkets = sortedEvents.flatMap(e =>
                e.markets.map(m => ({ ...m, eventTitle: e.title, eventSlug: e.slug }))
            );

            // Create timeout promise
            const timeoutPromise = new Promise<typeof sortedEvents>((resolve) => {
                setTimeout(() => {
                    const result = sortedEvents.map(e => ({
                        ...e,
                        markets: e.markets.map(m => ({
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
                            },
                        }))
                    }));
                    resolve(result);
                }, insiderTimeout);
            });

            // Fetch insider data for all markets
            const insiderPromise = Promise.all(
                sortedEvents.map(async (event) => {
                    const marketsWithDetection = await Promise.all(
                        event.markets.map(async (market) => {
                            // Only check active markets
                            if (!market.active || market.closed) {
                                return {
                                    ...market,
                                    insiderDetection: {
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
                            }

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
                    return { ...event, markets: marketsWithDetection };
                })
            );

            // Race between timeout and actual checks
            const result = await Promise.race([insiderPromise, timeoutPromise]);
            eventsWithInsider = result;
            insiderDetectedCount = result.reduce((count, event) => {
                return count + event.markets.filter(m => m.insiderDetection?.isInsider).length;
            }, 0);
        }

        return NextResponse.json({
            events: eventsWithInsider,
            categories: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })),
            totalEvents: eventsWithInsider.length,
            insiderDetected: insiderDetectedCount,
        });
    } catch (error) {
        console.error('Trending Events API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trending events' },
            { status: 500 }
        );
    }
}
