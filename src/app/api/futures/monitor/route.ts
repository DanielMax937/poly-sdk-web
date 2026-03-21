import { NextRequest, NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/api-wrapper';
import {
  startFuturesMonitor,
  stopFuturesMonitor,
  getFuturesMonitorStatus,
  getFuturesAlerts,
  getDefaultKeywords,
} from '@/lib/futures-monitor';

export const dynamic = 'force-dynamic';

export const GET = withMonitoring(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const autoStart = searchParams.get('autoStart') === 'true';
  const intervalMs = searchParams.get('intervalMs');
  const keywordsParam = searchParams.get('keywords');

  if (autoStart) {
    const keywords = keywordsParam
      ? keywordsParam.split(',').map(k => k.trim()).filter(Boolean)
      : undefined;
    const interval = intervalMs ? parseInt(intervalMs, 10) : undefined;
    await startFuturesMonitor({ keywords, intervalMs: interval });
  }

  return NextResponse.json({
    status: getFuturesMonitorStatus(),
    alerts: getFuturesAlerts(limit),
  });
}, 'futures-monitor:get');

export const POST = withMonitoring(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  const keywords = Array.isArray(body.keywords) ? body.keywords : undefined;
  const intervalMs = typeof body.intervalMs === 'number' ? body.intervalMs : undefined;

  await startFuturesMonitor({ keywords, intervalMs });
  return NextResponse.json({ status: getFuturesMonitorStatus() });
}, 'futures-monitor:post');

export const DELETE = withMonitoring(async () => {
  stopFuturesMonitor();
  return NextResponse.json({ status: getFuturesMonitorStatus() });
}, 'futures-monitor:delete');

export const DEFAULT_KEYWORDS = getDefaultKeywords();
