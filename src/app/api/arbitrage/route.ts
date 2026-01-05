import { NextRequest, NextResponse } from 'next/server';
import { getSDK } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const sdk = getSDK();
    const searchParams = request.nextUrl.searchParams;

    const conditionId = searchParams.get('conditionId');
    const threshold = parseFloat(searchParams.get('threshold') || '0.001');

    if (!conditionId) {
        return NextResponse.json(
            { error: 'conditionId is required' },
            { status: 400 }
        );
    }

    try {
        const arbitrage = await sdk.detectArbitrage(conditionId, threshold);
        return NextResponse.json({ arbitrage });
    } catch (error) {
        console.error('Arbitrage API error:', error);
        // Return null arbitrage (no opportunity) on error
        return NextResponse.json({ arbitrage: null, _mock: true });
    }
}
