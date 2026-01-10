import { NextRequest, NextResponse } from 'next/server';
import { clobApi, processOrderbook } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const conditionId = searchParams.get('conditionId');

    if (!conditionId) {
        return NextResponse.json({ error: 'conditionId is required' }, { status: 400 });
    }

    try {
        const books = await clobApi.getMarketOrderbook(conditionId);
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
