/**
 * Playwright script: Visit poly-sdk-web pages, take screenshots, verify fixes.
 * Run: npx tsx scripts/verify-ui-screenshot.ts
 * Requires: service running at BASE_URL (default http://127.0.0.1:3010)
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3010';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots');

async function main() {
  const results: { page: string; screenshot: string; verified?: string }[] = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    // 1. Homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);
    const homePath = path.join(SCREENSHOT_DIR, '01-home.png');
    await page.screenshot({ path: homePath, fullPage: true });
    results.push({ page: 'Homepage', screenshot: homePath });

    // 2. Futures Monitoring
    await page.goto(`${BASE_URL}/console/futures-monitor`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const monitorPath = path.join(SCREENSHOT_DIR, '02-futures-monitor.png');
    await page.screenshot({ path: monitorPath, fullPage: true });
    results.push({ page: 'Futures Monitoring', screenshot: monitorPath });

    // 3. Futures Alerts - verify keyword count
    await page.goto(`${BASE_URL}/console/futures-alerts`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Verify: input keywords count should match displayed Keywords stat
    const inputEl = page.locator('input[placeholder="gold, oil, bitcoin"]');
    const keywordsInputVal = await inputEl.inputValue().catch(() => '');
    const inputKeywords = keywordsInputVal.split(/[,，]/).map((k: string) => k.trim()).filter(Boolean);

    // Keywords StatCard: 3rd card in stats grid (Running, Interval, Keywords, Total alerts, Last run)
    const statsGrid = page.locator('div.mb-6.grid').filter({ hasText: 'Running' }).filter({ hasText: 'Keywords' });
    const keywordsCard = statsGrid.locator('.glass-card').nth(2);
    const displayedCountText = await keywordsCard.locator('.text-2xl').first().textContent().catch(() => null);
    const displayedCount = displayedCountText ? parseInt(displayedCountText.trim(), 10) : null;
    const displayValid = displayedCount !== null && !isNaN(displayedCount);

    const countMatch = displayValid && inputKeywords.length === displayedCount;
    const alertsPath = path.join(SCREENSHOT_DIR, '03-futures-alerts.png');
    await page.screenshot({ path: alertsPath, fullPage: true });
    results.push({
      page: 'Futures Alerts',
      screenshot: alertsPath,
      verified: countMatch
        ? `✓ Keywords count matches: input=${inputKeywords.length}, displayed=${displayedCount}`
        : `✗ Keywords: input=${inputKeywords.length}, displayed=${displayedCount} (expected same)`,
    });

    // Verify 5-keyword case: type 5 keywords, click Start, confirm displayed=5
    await inputEl.fill('gold, silver, oil, bitcoin, ethereum');
    await page.getByRole('button', { name: /Start|Apply/ }).first().click();
    await page.waitForTimeout(10000);
    const afterInputVal = await inputEl.inputValue().catch(() => '');
    const afterInputKeywords = afterInputVal.split(/[,，]/).map((k: string) => k.trim()).filter(Boolean);
    const afterStatsGrid = page.locator('div.mb-6.grid').filter({ hasText: 'Running' }).filter({ hasText: 'Keywords' });
    const afterKeywordsCard = afterStatsGrid.locator('.glass-card').nth(2);
    const afterDisplayedText = await afterKeywordsCard.locator('.text-2xl').first().textContent().catch(() => null);
    const afterDisplayedCount = afterDisplayedText ? parseInt(afterDisplayedText.trim(), 10) : null;
    const afterMatch = afterDisplayedCount === 5 && afterInputKeywords.length === 5;
    const alertsAfterPath = path.join(SCREENSHOT_DIR, '03b-futures-alerts-after-start.png');
    await page.screenshot({ path: alertsAfterPath, fullPage: true });
    results.push({
      page: 'Futures Alerts (after Start with 5)',
      screenshot: alertsAfterPath,
      verified: afterMatch ? `✓ After Start: input=5, displayed=5` : `✗ After Start: input=${afterInputKeywords.length}, displayed=${afterDisplayedCount}`,
    });

    // 4. Operations Monitoring
    await page.goto(`${BASE_URL}/console/ops-monitoring`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const opsPath = path.join(SCREENSHOT_DIR, '04-ops-monitoring.png');
    await page.screenshot({ path: opsPath, fullPage: true });
    results.push({ page: 'Operations Monitoring', screenshot: opsPath });

    await context.close();

    // Print results
    console.log('\n📸 Screenshots saved to:', SCREENSHOT_DIR);
    console.log('\n📋 Verification results:\n');
    for (const r of results) {
      console.log(`  ${r.page}: ${path.basename(r.screenshot)}`);
      if (r.verified) console.log(`    ${r.verified}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
