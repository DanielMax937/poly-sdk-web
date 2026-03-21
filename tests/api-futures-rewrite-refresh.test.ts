import { NextRequest } from 'next/server';
import { POST as postRefresh } from '@/app/api/futures/rewrite/refresh/route';
import { refreshRewriteCache } from '@/lib/futures-monitor';

jest.mock('@/lib/futures-monitor', () => ({
  refreshRewriteCache: jest.fn(),
}));

describe('Futures rewrite refresh API', () => {
  const mockedRefresh = refreshRewriteCache as unknown as jest.Mock;

  beforeEach(() => {
    mockedRefresh.mockReset();
  });

  it('POST /api/futures/rewrite/refresh returns refresh stats', async () => {
    mockedRefresh.mockResolvedValue({
      keywords: ['gold'],
      rewritesCount: 3,
      durationMs: 12,
    });

    const res = await postRefresh(new NextRequest('http://localhost/api/futures/rewrite/refresh', { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.rewritesCount).toBe(3);
  });

  it('POST /api/futures/rewrite/refresh handles errors', async () => {
    mockedRefresh.mockRejectedValue(new Error('boom'));

    const res = await postRefresh(new NextRequest('http://localhost/api/futures/rewrite/refresh', { method: 'POST' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
