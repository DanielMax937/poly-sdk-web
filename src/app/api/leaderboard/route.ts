import { NextRequest, NextResponse } from 'next/server';
import { getSDK } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

const mockLeaderboard = {
    entries: [
        { rank: 1, address: '0xabc123def456', pnl: 125000, volume: 2500000, positions: 45, trades: 320 },
        { rank: 2, address: '0xdef789ghi012', pnl: 98000, volume: 1800000, positions: 32, trades: 280 },
        { rank: 3, address: '0xghi345jkl678', pnl: 76000, volume: 1500000, positions: 28, trades: 210 },
        { rank: 4, address: '0xjkl901mno234', pnl: 54000, volume: 1200000, positions: 22, trades: 180 },
        { rank: 5, address: '0xmno567pqr890', pnl: 42000, volume: 950000, positions: 18, trades: 150 },
        { rank: 6, address: '0xpqr123stu456', pnl: 35000, volume: 800000, positions: 15, trades: 120 },
        { rank: 7, address: '0xstu789vwx012', pnl: 28000, volume: 650000, positions: 12, trades: 95 },
        { rank: 8, address: '0xvwx345yza678', pnl: 22000, volume: 520000, positions: 10, trades: 78 },
        { rank: 9, address: '0xyza901bcd234', pnl: 18000, volume: 420000, positions: 8, trades: 65 },
        { rank: 10, address: '0xbcd567efg890', pnl: 15000, volume: 350000, positions: 6, trades: 52 },
    ],
    total: 10,
    offset: 0,
    limit: 10,
};

export async function GET(request: NextRequest) {
    const sdk = getSDK();
    const searchParams = request.nextUrl.searchParams;

    const limit = parseInt(searchParams.get('limit') || '10');
    const timePeriod = (searchParams.get('timePeriod') || 'ALL') as 'DAY' | 'WEEK' | 'MONTH' | 'ALL';

    try {
        const leaderboard = await sdk.dataApi.getLeaderboard({ limit, timePeriod });
        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json({
            leaderboard: {
                ...mockLeaderboard,
                entries: mockLeaderboard.entries.slice(0, limit),
            },
            _mock: true
        });
    }
}
