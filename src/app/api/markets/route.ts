import { NextRequest, NextResponse } from 'next/server';
import { getSDK } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

// Mock data for when the API is unavailable
const mockMarkets = [
    {
        id: '1',
        conditionId: '0x123abc',
        slug: 'will-btc-reach-100k-2025',
        question: 'Will Bitcoin reach $100,000 by end of 2025?',
        volume: 5000000,
        volume24hr: 250000,
        outcomePrices: [0.65, 0.35],
    },
    {
        id: '2',
        conditionId: '0x456def',
        slug: 'us-election-2024-winner',
        question: 'Who will win the 2024 US Presidential Election?',
        volume: 12000000,
        volume24hr: 800000,
        outcomePrices: [0.52, 0.48],
    },
    {
        id: '3',
        conditionId: '0x789ghi',
        slug: 'will-eth-flip-btc-2025',
        question: 'Will Ethereum market cap exceed Bitcoin by 2025?',
        volume: 1500000,
        volume24hr: 75000,
        outcomePrices: [0.15, 0.85],
    },
    {
        id: '4',
        conditionId: '0xabcjkl',
        slug: 'fed-rate-cut-january-2025',
        question: 'Will the Fed cut rates in January 2025?',
        volume: 800000,
        volume24hr: 45000,
        outcomePrices: [0.35, 0.65],
    },
    {
        id: '5',
        conditionId: '0xdefmno',
        slug: 'super-bowl-2025-winner',
        question: 'Who will win Super Bowl 2025?',
        volume: 3500000,
        volume24hr: 180000,
        outcomePrices: [0.55, 0.45],
    },
    {
        id: '6',
        conditionId: '0xghipqr',
        slug: 'ai-breakthrough-2025',
        question: 'Will there be a major AI breakthrough in 2025?',
        volume: 2000000,
        volume24hr: 95000,
        outcomePrices: [0.72, 0.28],
    },
];

const mockUnifiedMarket = {
    conditionId: '0x123abc',
    question: 'Will Bitcoin reach $100,000 by end of 2025?',
    tokens: [
        { tokenId: 'token-yes-123', outcome: 'Yes', price: 0.65 },
        { tokenId: 'token-no-123', outcome: 'No', price: 0.35 },
    ],
    source: 'mock' as const,
};

export async function GET(request: NextRequest) {
    const sdk = getSDK();
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
        // If specific market requested
        if (id || slug) {
            try {
                const identifier = id || slug || '';
                const market = await sdk.getMarket(identifier);
                return NextResponse.json({ market });
            } catch {
                // Return mock unified market on error
                return NextResponse.json({
                    market: mockUnifiedMarket,
                    _mock: true
                });
            }
        }

        // Otherwise return trending markets
        try {
            const markets = await sdk.gammaApi.getTrendingMarkets(limit);
            return NextResponse.json({ markets });
        } catch {
            // Return mock data on error
            return NextResponse.json({
                markets: mockMarkets.slice(0, limit),
                _mock: true
            });
        }
    } catch (error) {
        console.error('Markets API error:', error);
        // Final fallback to mock data
        return NextResponse.json({
            markets: mockMarkets.slice(0, limit),
            _mock: true
        });
    }
}
