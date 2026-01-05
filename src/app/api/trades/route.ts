import { NextRequest, NextResponse } from 'next/server';
import { getSDK } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

const mockTrades = [
    { price: 0.65, size: 100, side: 'BUY', timestamp: Date.now() - 60000, outcomeIndex: 0, outcome: 'Yes', proxyWallet: '0xabc123' },
    { price: 0.64, size: 50, side: 'SELL', timestamp: Date.now() - 120000, outcomeIndex: 0, outcome: 'Yes', proxyWallet: '0xdef456' },
    { price: 0.35, size: 75, side: 'BUY', timestamp: Date.now() - 180000, outcomeIndex: 1, outcome: 'No', proxyWallet: '0xghi789' },
    { price: 0.66, size: 200, side: 'BUY', timestamp: Date.now() - 240000, outcomeIndex: 0, outcome: 'Yes', proxyWallet: '0xjkl012' },
    { price: 0.34, size: 150, side: 'SELL', timestamp: Date.now() - 300000, outcomeIndex: 1, outcome: 'No', proxyWallet: '0xmno345' },
];

export async function GET(request: NextRequest) {
    const sdk = getSDK();
    const searchParams = request.nextUrl.searchParams;

    const market = searchParams.get('market');
    const limit = parseInt(searchParams.get('limit') || '500');

    try {
        if (market) {
            try {
                const trades = await sdk.dataApi.getTradesByMarket(market, limit);
                return NextResponse.json({ trades });
            } catch {
                return NextResponse.json({ trades: mockTrades, _mock: true });
            }
        } else {
            try {
                const trades = await sdk.dataApi.getTrades({ limit });
                return NextResponse.json({ trades });
            } catch {
                return NextResponse.json({ trades: mockTrades, _mock: true });
            }
        }
    } catch (error) {
        console.error('Trades API error:', error);
        return NextResponse.json({ trades: mockTrades, _mock: true });
    }
}
