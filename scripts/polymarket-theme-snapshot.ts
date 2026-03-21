/**
 * CLI: pull Polymarket Gamma tags + high-liquidity events in finance/geo/politics themes,
 * write JSON report for maintaining futures hard rules.
 *
 * Usage (from repo root):
 *   npm run snapshot:themes
 *   HTTP_PROXY=http://127.0.0.1:1087 npm run snapshot:themes
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getProxyConfig } from '../src/lib/proxy-fetch';
import { buildThemeSnapshotReport } from '../src/lib/polymarket-theme-snapshot';

async function main() {
  if (process.env.POLYMARKET_REQUIRE_PROXY === '1' && !getProxyConfig().usingProxy) {
    console.error(
      '[snapshot:themes] POLYMARKET_REQUIRE_PROXY=1 but no proxy. Set HTTPS_PROXY or HTTP_PROXY (e.g. HTTPS_PROXY=http://127.0.0.1:1087)'
    );
    process.exit(1);
  }
  const outDir = join(process.cwd(), 'reports');
  mkdirSync(outDir, { recursive: true });
  const report = await buildThemeSnapshotReport();
  const outPath = join(outDir, 'polymarket-theme-snapshot.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Wrote', outPath);
  console.log(
    'tags matched:',
    report.tagSelection.matchedTagCount,
    '/ fetched:',
    report.tagSelection.totalTagsFetched,
    '| unique events:',
    report.events.uniqueEventIds
  );
  if (report.notes.length) console.log('Notes:', report.notes);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
