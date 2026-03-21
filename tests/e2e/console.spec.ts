import { test, expect } from '@playwright/test';

const jsonResponse = (data: unknown) => ({
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

test.afterEach(async ({ page }, testInfo) => {
  const safeName = testInfo.title.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
  await page.screenshot({
    path: `test-results/${safeName}.png`,
    fullPage: true,
  });
});

test('Home page loads console cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Poly SDK Web' })).toBeVisible();
  const main = page.locator('main');
  await expect(main.getByRole('link', { name: /Futures Monitoring/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /Futures Alerts/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /Operations Monitoring/ })).toBeVisible();
});

test('Futures Monitoring page loads with mocked data', async ({ page }) => {
  await page.route('**/api/base/search**', async (route) => {
    await route.fulfill(jsonResponse({
      markets: [
        {
          id: 'm1',
          conditionId: 'c1',
          question: 'Gold above $2,000?',
          slug: 'gold-2000',
          volume: 10000,
          volume24hr: 2000,
          liquidity: 5000,
          endDate: new Date().toISOString(),
          outcomePrices: ['0.55', '0.45'],
          active: true,
        },
      ],
      events: [],
      query: 'gold',
      counts: { insiderDetected: 0 },
    }));
  });

  await page.goto('/console/futures-monitor');
  await expect(page.getByRole('heading', { name: 'Futures Monitoring' })).toBeVisible();
  await expect(page.getByText('Markets Found')).toBeVisible();
  await expect(page.getByText('Gold above $2,000?')).toBeVisible();
});

test('Futures Alerts page loads status and alerts', async ({ page }) => {
  await page.route('**/api/futures/alerts**', async (route) => {
    await route.fulfill(jsonResponse({
      status: {
        running: true,
        intervalMs: 60000,
        keywords: ['gold'],
        lastRunAt: Date.now(),
        alertsCount: 1,
      },
      alerts: [
        {
          id: 'a1',
          timestamp: Date.now(),
          conditionId: 'c1',
          question: 'Gold above $2,000?',
          keyword: 'gold',
          type: 'movement',
          severity: 'low',
          message: 'Bid depth 60%',
        },
      ],
    }));
  });

  await page.goto('/console/futures-alerts');
  await expect(page.getByRole('heading', { name: 'Futures Alerts' })).toBeVisible();
  await expect(page.getByText('Gold above $2,000?')).toBeVisible();
});

test('Operations Monitoring page loads metrics', async ({ page }) => {
  await page.route('**/api/metrics**', async (route) => {
    await route.fulfill(jsonResponse({
      summary: {
        windowMs: 300000,
        total: 10,
        errors: 1,
        errorRate: 0.1,
        p95: 1200,
        lastAlertAt: 0,
      },
      recent: [
        {
          route: 'base/search',
          method: 'GET',
          status: 200,
          durationMs: 120,
          timestamp: Date.now(),
        },
      ],
    }));
  });

  await page.goto('/console/ops-monitoring');
  await expect(page.getByRole('heading', { name: 'Operations Monitoring' })).toBeVisible();
  await expect(page.getByText('Recent Requests')).toBeVisible();
});
