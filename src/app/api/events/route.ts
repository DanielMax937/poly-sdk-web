import { NextRequest, NextResponse } from 'next/server';
import { gammaApi } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (!slug && !id) {
        return NextResponse.json({ error: 'slug or id is required' }, { status: 400 });
    }

    try {
        const identifier = slug || id || '';
        const event = slug
            ? await gammaApi.getEventBySlug(identifier)
            : await gammaApi.getEventById(identifier);

        if (event) {
            return NextResponse.json({ event });
        }
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    } catch (error) {
        console.error('Events API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch event' },
            { status: 500 }
        );
    }
}
