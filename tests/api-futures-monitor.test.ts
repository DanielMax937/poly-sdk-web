import { NextRequest } from 'next/server';
import { GET as getMonitor, POST as postMonitor, DELETE as deleteMonitor } from '@/app/api/futures/monitor/route';
import { GET as getAlerts } from '@/app/api/futures/alerts/route';
import {
  startFuturesMonitor,
  stopFuturesMonitor,
  getFuturesMonitorStatus,
  getFuturesAlerts,
} from '@/lib/futures-monitor';

jest.mock('@/lib/futures-monitor', () => ({
  startFuturesMonitor: jest.fn(),
  stopFuturesMonitor: jest.fn(),
  getFuturesMonitorStatus: jest.fn(),
  getFuturesAlerts: jest.fn(),
  getDefaultKeywords: jest.fn(),
}));

describe('Futures monitor API', () => {
  const mockedStart = startFuturesMonitor as unknown as jest.Mock;
  const mockedStop = stopFuturesMonitor as unknown as jest.Mock;
  const mockedStatus = getFuturesMonitorStatus as unknown as jest.Mock;
  const mockedAlerts = getFuturesAlerts as unknown as jest.Mock;

  beforeEach(() => {
    mockedStart.mockReset();
    mockedStop.mockReset();
    mockedStatus.mockReset();
    mockedAlerts.mockReset();
  });

  it('GET /api/futures/monitor returns status and alerts', async () => {
    mockedStatus.mockReturnValue({ running: false, intervalMs: 60000, keywords: [], lastRunAt: null, alertsCount: 0 });
    mockedAlerts.mockReturnValue([]);

    const req = new NextRequest('http://localhost/api/futures/monitor?limit=10');
    const res = await getMonitor(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status.running).toBe(false);
    expect(body.alerts).toHaveLength(0);
  });

  it('POST /api/futures/monitor starts monitor', async () => {
    mockedStatus.mockReturnValue({ running: true, intervalMs: 60000, keywords: ['gold'], lastRunAt: 1, alertsCount: 0 });

    const req = new NextRequest('http://localhost/api/futures/monitor', {
      method: 'POST',
      body: JSON.stringify({ keywords: ['gold'], intervalMs: 60000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await postMonitor(req);
    expect(res.status).toBe(200);
    expect(mockedStart).toHaveBeenCalled();
  });

  it('DELETE /api/futures/monitor stops monitor', async () => {
    mockedStatus.mockReturnValue({ running: false, intervalMs: 60000, keywords: [], lastRunAt: null, alertsCount: 0 });

    const res = await deleteMonitor(new NextRequest('http://localhost/api/futures/monitor', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(mockedStop).toHaveBeenCalled();
  });

  it('GET /api/futures/alerts returns alerts', async () => {
    mockedStatus.mockReturnValue({ running: true, intervalMs: 60000, keywords: ['gold'], lastRunAt: 1, alertsCount: 1 });
    mockedAlerts.mockReturnValue([
      { id: 'a1', timestamp: Date.now(), conditionId: 'c1', question: 'q', keyword: 'gold', type: 'movement', severity: 'low', message: 'test' },
    ]);

    const res = await getAlerts(new NextRequest('http://localhost/api/futures/alerts?limit=1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alerts).toHaveLength(1);
  });
});
