import { NextRequest, NextResponse } from 'next/server';
import { getSDK } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

const mockPositions = [
    { conditionId: '0x123', title: 'Will BTC reach $100k?', outcome: 'Yes', size: 150, avgPrice: 0.55, curPrice: 0.65, cashPnl: 15, percentPnl: 18 },
    { conditionId: '0x456', title: 'Will ETH flip BTC?', outcome: 'No', size: 80, avgPrice: 0.80, curPrice: 0.85, cashPnl: 4, percentPnl: 6 },
];

const mockActivity = [
    { type: 'TRADE', side: 'BUY', size: 50, price: 0.55, usdcSize: 27.5, outcome: 'Yes', timestamp: Date.now() - 3600000 },
    { type: 'TRADE', side: 'SELL', size: 25, price: 0.62, usdcSize: 15.5, outcome: 'Yes', timestamp: Date.now() - 7200000 },
];

const mockProfile = {
    address: '0xabc123def456',
    totalPnL: 12500,
    smartScore: 78,
    positionCount: 15,
    lastActiveAt: new Date().toISOString(),
};

export async function GET(request: NextRequest) {
    const sdk = getSDK();
    const searchParams = request.nextUrl.searchParams;

    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'positions';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!address) {
        return NextResponse.json(
            { error: 'address is required' },
            { status: 400 }
        );
    }

    try {
        if (type === 'positions') {
            try {
                const positions = await sdk.dataApi.getPositions(address, { limit });
                return NextResponse.json({ positions });
            } catch {
                return NextResponse.json({ positions: mockPositions, _mock: true });
            }
        } else if (type === 'activity') {
            try {
                const activity = await sdk.dataApi.getActivity(address, { limit });
                return NextResponse.json({ activity });
            } catch {
                return NextResponse.json({ activity: mockActivity, _mock: true });
            }
        } else if (type === 'profile') {
            try {
                const profile = await sdk.wallets.getWalletProfile(address);
                return NextResponse.json({ profile });
            } catch {
                return NextResponse.json({ profile: { ...mockProfile, address }, _mock: true });
            }
        }

        return NextResponse.json(
            { error: 'Invalid type parameter' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Wallet API error:', error);
        return NextResponse.json({ positions: mockPositions, _mock: true });
    }
}
