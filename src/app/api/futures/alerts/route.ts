import { NextRequest, NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/api-wrapper';
import { getFuturesAlerts, getFuturesMonitorStatus } from '@/lib/futures-monitor';

export const dynamic = 'force-dynamic';

export const GET = withMonitoring(async (request: NextRequest) => {
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
  return NextResponse.json({
    status: getFuturesMonitorStatus(),
    alerts: getFuturesAlerts(limit),
  });
}, 'futures-alerts:get');
