import { NextRequest, NextResponse } from 'next/server';
import { dataApi } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'positions';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!address) {
        return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }

    try {
        if (type === 'positions') {
            const positions = await dataApi.getPositions(address, { limit });
            return NextResponse.json({ positions });
        } else if (type === 'activity') {
            const activity = await dataApi.getActivity(address, { limit });
            return NextResponse.json({ activity });
        } else if (type === 'profile') {
            return NextResponse.json(
                { error: 'Profile endpoint not implemented' },
                { status: 501 }
            );
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (error) {
        console.error('Wallet API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wallet data' },
            { status: 500 }
        );
    }
}
