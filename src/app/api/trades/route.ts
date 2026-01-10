import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market');
    const limit = parseInt(searchParams.get('limit') || '500');

    try {
        if (market) {
            const trades = await dataApi.getTradesByMarket(market, limit);
            return NextResponse.json({ trades });
        } else {
            const trades = await dataApi.getTrades({ limit });
            return NextResponse.json({ trades });
        }
    } catch (error) {
        console.error('Trades API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trades' },
            { status: 500 }
        );
    }
}
