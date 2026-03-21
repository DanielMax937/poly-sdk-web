import { NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/api-wrapper';
import { getMetricsSnapshot, getRecentMetrics } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

export const GET = withMonitoring(async (request) => {
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '200', 10);
  return NextResponse.json({
    summary: getMetricsSnapshot(),
    recent: getRecentMetrics(limit),
  });
}, 'metrics');
