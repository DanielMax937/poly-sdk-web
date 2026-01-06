import { NextRequest, NextResponse } from 'next/server';
import { gammaApi, getUnifiedMarket, GammaMarket } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

// Mock data for when the API is unavailable
const mockMarkets: GammaMarket[] = [
    {
        id: '1',
        condition_id: '0x123abc',
        question_id: 'q1',
        slug: 'will-btc-reach-100k-2025',
        question: 'Will Bitcoin reach $100,000 by end of 2025?',
        volume: 5000000,
        volume24hr: 250000,
        liquidity: 500000,
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.65', '0.35'],
        clobTokenIds: ['token-yes-1', 'token-no-1'],
        active: true,
        closed: false,
        archived: false,
    },
    {
        id: '2',
        condition_id: '0x456def',
        question_id: 'q2',
        slug: 'us-election-2024-winner',
        question: 'Who will win the 2024 US Presidential Election?',
        volume: 12000000,
        volume24hr: 800000,
        liquidity: 1200000,
        startDate: '2024-01-01',
        endDate: '2024-11-15',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.52', '0.48'],
        clobTokenIds: ['token-yes-2', 'token-no-2'],
        active: true,
        closed: false,
        archived: false,
    },
    {
        id: '3',
        condition_id: '0x789ghi',
        question_id: 'q3',
        slug: 'will-eth-flip-btc-2025',
        question: 'Will Ethereum market cap exceed Bitcoin by 2025?',
        volume: 1500000,
        volume24hr: 75000,
        liquidity: 150000,
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.15', '0.85'],
        clobTokenIds: ['token-yes-3', 'token-no-3'],
        active: true,
        closed: false,
        archived: false,
    },
    {
        id: '4',
        condition_id: '0xabcjkl',
        question_id: 'q4',
        slug: 'fed-rate-cut-january-2025',
        question: 'Will the Fed cut rates in January 2025?',
        volume: 800000,
        volume24hr: 45000,
        liquidity: 80000,
        startDate: '2024-12-01',
        endDate: '2025-01-31',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.35', '0.65'],
        clobTokenIds: ['token-yes-4', 'token-no-4'],
        active: true,
        closed: false,
        archived: false,
    },
    {
        id: '5',
        condition_id: '0xdefmno',
        question_id: 'q5',
        slug: 'super-bowl-2025-winner',
        question: 'Who will win Super Bowl 2025?',
        volume: 3500000,
        volume24hr: 180000,
        liquidity: 350000,
        startDate: '2024-09-01',
        endDate: '2025-02-15',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.55', '0.45'],
        clobTokenIds: ['token-yes-5', 'token-no-5'],
        active: true,
        closed: false,
        archived: false,
    },
    {
        id: '6',
        condition_id: '0xghipqr',
        question_id: 'q6',
        slug: 'ai-breakthrough-2025',
        question: 'Will there be a major AI breakthrough in 2025?',
        volume: 2000000,
        volume24hr: 95000,
        liquidity: 200000,
        startDate: '2024-01-01',
        endDate: '2025-12-31',
        outcomes: ['Yes', 'No'],
        outcomePrices: ['0.72', '0.28'],
        clobTokenIds: ['token-yes-6', 'token-no-6'],
        active: true,
        closed: false,
        archived: false,
    },
];

const mockUnifiedMarket = {
    conditionId: '0x123abc',
    question: 'Will Bitcoin reach $100,000 by end of 2025?',
    slug: 'will-btc-reach-100k-2025',
    volume: 5000000,
    volume24hr: 250000,
    tokens: [
        { tokenId: 'token-yes-123', outcome: 'Yes', price: 0.65 },
        { tokenId: 'token-no-123', outcome: 'No', price: 0.35 },
    ],
    source: 'mock' as const,
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    try {
        // If specific market requested
        if (id || slug) {
            try {
                const identifier = id || slug || '';
                const market = await getUnifiedMarket(identifier);
                if (market) {
                    return NextResponse.json({ market });
                }
                return NextResponse.json({ market: mockUnifiedMarket, _mock: true });
            } catch {
                return NextResponse.json({ market: mockUnifiedMarket, _mock: true });
            }
        }

        // Otherwise return trending markets
        try {
            const markets = await gammaApi.getTrendingMarkets(limit);
            return NextResponse.json({ markets });
        } catch {
            return NextResponse.json({ markets: mockMarkets.slice(0, limit), _mock: true });
        }
    } catch (error) {
        console.error('Markets API error:', error);
        return NextResponse.json({ markets: mockMarkets.slice(0, limit), _mock: true });
    }
}
