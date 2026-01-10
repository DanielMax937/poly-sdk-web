import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conditionId = searchParams.get('conditionId');
    const yesTokenId = searchParams.get('yesTokenId');
    const noTokenId = searchParams.get('noTokenId');

    if (!conditionId && (!yesTokenId || !noTokenId)) {
        return NextResponse.json({ error: 'conditionId or both yesTokenId and noTokenId are required' }, { status: 400 });
    }

    try {
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

        if (!books) {
            return NextResponse.json({ error: 'Orderbook not found' }, { status: 404 });
        }
        const orderbook = processOrderbook(books.yes, books.no);
        return NextResponse.json({ orderbook });
    } catch (error) {
        console.error('Orderbook API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orderbook' },
            { status: 500 }
        );
    }
}
