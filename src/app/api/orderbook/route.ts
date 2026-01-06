import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

const mockOrderbook = {
    yes: { bid: 0.64, ask: 0.66, bidSize: 5000, askSize: 4500, spread: 0.02 },
    no: { bid: 0.33, ask: 0.36, bidSize: 4200, askSize: 3800, spread: 0.03 },
    summary: {
        askSum: 1.02,
        bidSum: 0.97,
        longArbProfit: 0,
        shortArbProfit: 0.02,
        totalBidDepth: 45000,
        totalAskDepth: 42000,
        imbalanceRatio: 1.07,
    },
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conditionId = searchParams.get('conditionId');

    if (!conditionId) {
        return NextResponse.json({ error: 'conditionId is required' }, { status: 400 });
    }

    try {
        const books = await clobApi.getMarketOrderbook(conditionId);
        if (!books) {
            return NextResponse.json({ orderbook: mockOrderbook, _mock: true });
        }
        const orderbook = processOrderbook(books.yes, books.no);
        return NextResponse.json({ orderbook });
    } catch (error) {
        console.error('Orderbook API error:', error);
        return NextResponse.json({ orderbook: mockOrderbook, _mock: true });
    }
}
