import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook } from '@/lib/sdk';
import { withMonitoring } from '@/lib/api-wrapper';
import { apiCache } from '@/lib/ttl-cache';

export const dynamic = 'force-dynamic';

export const GET = withMonitoring(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const conditionId = searchParams.get('conditionId');
    const yesTokenId = searchParams.get('yesTokenId');
    const noTokenId = searchParams.get('noTokenId');

    if (!conditionId && (!yesTokenId || !noTokenId)) {
        return NextResponse.json({ error: 'conditionId or both yesTokenId and noTokenId are required' }, { status: 400 });
    }

    try {
        const cacheKey = `orderbook:${conditionId || ''}:${yesTokenId || ''}:${noTokenId || ''}`;
        const payload = await apiCache.getOrSet(cacheKey, 2000, async () => {
            let books;

            if (yesTokenId && noTokenId) {
                // Direct tokenId approach (fallback for when Gamma API doesn't return tokenIds)
                const [yesBook, noBook] = await Promise.all([
                    clobApi.getOrderbook(yesTokenId),
                    clobApi.getOrderbook(noTokenId),
                ]);
                books = { yes: yesBook, no: noBook };
            } else if (conditionId) {
                // conditionId approach (tries to fetch tokenIds from Gamma API)
                books = await clobApi.getMarketOrderbook(conditionId);
            }

            if (!books) return null;
            const orderbook = processOrderbook(books.yes, books.no);
            return { orderbook };
        });

        if (!payload) {
            return NextResponse.json({ error: 'Orderbook not found' }, { status: 404 });
        }
        return NextResponse.json(payload);
    } catch (error) {
        console.error('Orderbook API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orderbook' },
            { status: 500 }
        );
    }
}, 'orderbook');
