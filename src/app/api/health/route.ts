import { NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/api-wrapper';

export const dynamic = 'force-dynamic';

export const GET = withMonitoring(async () => {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}, 'health');
