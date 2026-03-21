import { NextRequest } from 'next/server';
import { GET } from '@/app/api/base/search/route';
import { gammaApi } from '@/lib/sdk';
import { rewriteFuturesQuery } from '@/lib/futures-rewrite';

jest.mock('@/lib/sdk', () => ({
  gammaApi: {
    search: jest.fn(),
  },
  clobApi: {
    getMarketOrderbook: jest.fn(),
  },
  processOrderbook: jest.fn(),
  detectInsiderTrading: jest.fn(),
}));

jest.mock('@/lib/futures-rewrite', () => ({
  rewriteFuturesQuery: jest.fn(),
}));

describe('GET /api/base/search', () => {
  const mockedGamma = gammaApi as unknown as { search: jest.Mock };
  const mockedRewrite = rewriteFuturesQuery as unknown as jest.Mock;

  beforeEach(() => {
    mockedGamma.search.mockReset();
    mockedRewrite.mockReset();
  });

  it('returns 400 when q is missing', async () => {
    const req = new NextRequest('http://localhost/api/base/search');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns markets when query is provided', async () => {
    mockedRewrite.mockResolvedValue(['gold']);
    mockedGamma.search.mockResolvedValue({
      markets: [
        {
          conditionId: 'c1',
          active: true,
          liquidity: 5000,
          liquidityNum: 5000,
        },
      ],
      events: [],
    });

    const req = new NextRequest('http://localhost/api/base/search?q=gold&checkInsider=false&limit=1&minLiquidity=1000');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.markets).toHaveLength(1);
    expect(body.query).toBe('gold');
  });
});
