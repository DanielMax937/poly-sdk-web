import { NextRequest, NextResponse } from 'next/server';
import { gammaApi, getUnifiedMarket } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
        // If specific market requested
        if (id || slug) {
            const identifier = id || slug || '';
            const market = await getUnifiedMarket(identifier);
            if (market) {
                return NextResponse.json({ market });
            }
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        // Otherwise return trending markets
        const markets = await gammaApi.getTrendingMarkets(limit);
        return NextResponse.json({ markets });
    } catch (error) {
        console.error('Markets API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch markets' },
            { status: 500 }
        );
    }
}
