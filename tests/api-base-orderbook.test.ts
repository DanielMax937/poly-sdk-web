import { NextRequest } from 'next/server';
import { GET } from '@/app/api/base/orderbook/route';
import { clobApi, processOrderbook } from '@/lib/sdk';

jest.mock('@/lib/sdk', () => ({
  clobApi: {
    getOrderbook: jest.fn(),
    getMarketOrderbook: jest.fn(),
  },
  processOrderbook: jest.fn(),
}));

describe('GET /api/base/orderbook', () => {
  const mockedClob = clobApi as unknown as {
    getOrderbook: jest.Mock;
    getMarketOrderbook: jest.Mock;
  };
  const mockedProcess = processOrderbook as unknown as jest.Mock;

  beforeEach(() => {
    mockedClob.getOrderbook.mockReset();
    mockedClob.getMarketOrderbook.mockReset();
    mockedProcess.mockReset();
  });

  it('returns 400 when params missing', async () => {
    const req = new NextRequest('http://localhost/api/base/orderbook');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns orderbook when yes/no token ids provided', async () => {
    mockedClob.getOrderbook.mockResolvedValue({ bids: [], asks: [] });
    mockedProcess.mockReturnValue({
      yes: { bid: 0.5, ask: 0.6, bidSize: 10, askSize: 10, spread: 0.1 },
      no: { bid: 0.4, ask: 0.5, bidSize: 10, askSize: 10, spread: 0.1 },
      summary: { askSum: 1.1, bidSum: 0.9, longArbProfit: 0, shortArbProfit: 0, totalBidDepth: 0, totalAskDepth: 0, imbalanceRatio: 1 },
    });

    const req = new NextRequest('http://localhost/api/base/orderbook?yesTokenId=1&noTokenId=2');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.orderbook).toBeTruthy();
    expect(body.orderbook.yes.bid).toBe(0.5);
  });
});
