import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook, detectArbitrage } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conditionId = searchParams.get('conditionId');
    const yesTokenId = searchParams.get('yesTokenId');
    const noTokenId = searchParams.get('noTokenId');
    const threshold = parseFloat(searchParams.get('threshold') || '0.001');

    if (!conditionId && (!yesTokenId || !noTokenId)) {
        return NextResponse.json({ error: 'conditionId or both yesTokenId and noTokenId are required' }, { status: 400 });
    }

    try {
        let books;

        if (yesTokenId && noTokenId) {
            // Direct tokenId approach
            const [yesBook, noBook] = await Promise.all([
                clobApi.getOrderbook(yesTokenId),
                clobApi.getOrderbook(noTokenId),
            ]);
            books = { yes: yesBook, no: noBook };
        } else if (conditionId) {
            // conditionId approach
            books = await clobApi.getMarketOrderbook(conditionId);
        }

        if (!books) {
            return NextResponse.json({ error: 'Orderbook not found' }, { status: 404 });
        }

        const processed = processOrderbook(books.yes, books.no);
        const arbitrage = detectArbitrage(processed, threshold);
        return NextResponse.json({ arbitrage });
    } catch (error) {
        console.error('Arbitrage API error:', error);
        return NextResponse.json(
            { error: 'Failed to detect arbitrage' },
            { status: 500 }
        );
    }
}
