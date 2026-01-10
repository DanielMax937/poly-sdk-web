import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const timePeriod = searchParams.get('timePeriod') || 'ALL';

    try {
        const leaderboard = await dataApi.getLeaderboard({ limit, timePeriod });
        return NextResponse.json({ leaderboard });
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch leaderboard' },
            { status: 500 }
        );
    }
}
