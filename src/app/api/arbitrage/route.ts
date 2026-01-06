import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook, detectArbitrage } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conditionId = searchParams.get('conditionId');
    const threshold = parseFloat(searchParams.get('threshold') || '0.001');

    if (!conditionId) {
        return NextResponse.json({ error: 'conditionId is required' }, { status: 400 });
    }

    try {
        const books = await clobApi.getMarketOrderbook(conditionId);
        if (!books) {
            return NextResponse.json({ arbitrage: null, _mock: true });
        }

        const processed = processOrderbook(books.yes, books.no);
        const arbitrage = detectArbitrage(processed, threshold);
        return NextResponse.json({ arbitrage });
    } catch (error) {
        console.error('Arbitrage API error:', error);
        return NextResponse.json({ arbitrage: null, _mock: true });
    }
}
