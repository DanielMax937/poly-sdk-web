import { NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/api-wrapper';
import { refreshRewriteCache } from '@/lib/futures-monitor';

export const dynamic = 'force-dynamic';

export const POST = withMonitoring(async () => {
  try {
    const result = await refreshRewriteCache();
    return NextResponse.json({
      ok: true,
      keywords: result.keywords,
      rewritesCount: result.rewritesCount,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error('Rewrite refresh error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to refresh rewrite cache' },
      { status: 500 }
    );
  }
}, 'futures-rewrite-refresh:post');
