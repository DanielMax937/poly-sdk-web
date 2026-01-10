import { NextRequest, NextResponse } from 'next/server';
import { orderApi, OrderParams } from '@/lib/orders';

/**
 * GET /api/orders - List open orders
 * GET /api/orders?orderId=xxx - Get specific order
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderApi.isConfigured()) {
        return NextResponse.json(
            { error: 'Order credentials not configured', configured: false },
            { status: 503 }
        );
    }

    try {
        if (orderId) {
            const result = await orderApi.getOrder(orderId);
            if (result.errorMsg) {
                return NextResponse.json({ error: result.errorMsg }, { status: 500 });
            }
            if (!result.order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            return NextResponse.json({ order: result.order });
        }

        const result = await orderApi.getOpenOrders();
        if (result.errorMsg) {
            return NextResponse.json({ error: result.errorMsg }, { status: 500 });
        }
        return NextResponse.json({ orders: result.orders });
    } catch (error) {
        console.error('Orders API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/orders - Create new order
 * Body: { tokenId, price, size, side, orderType?, expiration? }
 */
export async function POST(request: NextRequest) {
    if (!orderApi.isConfigured()) {
        return NextResponse.json(
            { error: 'Order credentials not configured', configured: false },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.tokenId || body.price === undefined || body.size === undefined || !body.side) {
            return NextResponse.json(
                { error: 'Missing required fields: tokenId, price, size, side' },
                { status: 400 }
            );
        }

        const params: OrderParams = {
            tokenId: body.tokenId,
            price: Number(body.price),
            size: Number(body.size),
            side: body.side.toUpperCase() as 'BUY' | 'SELL',
            orderType: body.orderType?.toUpperCase() || 'GTC',
            expiration: body.expiration ? Number(body.expiration) : undefined,
            postOnly: body.postOnly,
        };

        const result = await orderApi.createOrder(params);

        if (!result.success) {
            return NextResponse.json(
                { error: result.errorMsg || 'Failed to create order' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            orderId: result.orderId,
            status: result.status,
        });
    } catch (error) {
        console.error('Orders API error:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/orders?orderId=xxx - Cancel order
 * DELETE /api/orders?all=true - Cancel all orders
 */
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const cancelAll = searchParams.get('all') === 'true';

    if (!orderApi.isConfigured()) {
        return NextResponse.json(
            { error: 'Order credentials not configured', configured: false },
            { status: 503 }
        );
    }

    try {
        if (cancelAll) {
            const result = await orderApi.cancelAllOrders();
            if (!result.success) {
                return NextResponse.json({ error: result.errorMsg }, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'All orders cancelled' });
        }

        if (!orderId) {
            return NextResponse.json(
                { error: 'Missing orderId parameter' },
                { status: 400 }
            );
        }

        const result = await orderApi.cancelOrder(orderId);
        if (!result.success) {
            return NextResponse.json({ error: result.errorMsg }, { status: 500 });
        }
        return NextResponse.json({ success: true, orderId });
    } catch (error) {
        console.error('Orders API error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel order' },
            { status: 500 }
        );
    }
}
