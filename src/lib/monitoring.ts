import crypto from 'crypto';

export type RequestMetric = {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
};

const MAX_METRICS = 2000;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const metrics: RequestMetric[] = [];

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL || '';
const ALERT_MIN_REQUESTS = parseInt(process.env.ALERT_MIN_REQUESTS || '20', 10);
const ALERT_ERROR_RATE = parseFloat(process.env.ALERT_ERROR_RATE || '0.2'); // 20%
const ALERT_P95_MS = parseInt(process.env.ALERT_P95_MS || '2500', 10);
const ALERT_COOLDOWN_MS = parseInt(process.env.ALERT_COOLDOWN_MS || String(5 * 60 * 1000), 10);

let lastAlertAt = 0;

function trimOldMetrics(now: number) {
  while (metrics.length > 0 && now - metrics[0].timestamp > WINDOW_MS) {
    metrics.shift();
  }
  if (metrics.length > MAX_METRICS) {
    metrics.splice(0, metrics.length - MAX_METRICS);
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function computeStats() {
  const now = Date.now();
  trimOldMetrics(now);

  const total = metrics.length;
  const errors = metrics.filter(m => m.status >= 500).length;
  const durations = metrics.map(m => m.durationMs);
  const p95 = percentile(durations, 0.95);

  return {
    windowMs: WINDOW_MS,
    total,
    errors,
    errorRate: total > 0 ? errors / total : 0,
    p95,
    lastAlertAt,
  };
}

async function sendAlert(payload: Record<string, unknown>) {
  if (!ALERT_WEBHOOK_URL) return;
  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore webhook failures to avoid cascading errors
  }
}

export function createRequestId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export async function recordRequest(metric: RequestMetric) {
  metrics.push(metric);
  const stats = computeStats();
  const now = Date.now();

  if (
    stats.total >= ALERT_MIN_REQUESTS &&
    (stats.errorRate >= ALERT_ERROR_RATE || stats.p95 >= ALERT_P95_MS) &&
    now - lastAlertAt >= ALERT_COOLDOWN_MS
  ) {
    lastAlertAt = now;
    await sendAlert({
      type: 'api.alert',
      message: 'API health degraded',
      stats,
      threshold: {
        minRequests: ALERT_MIN_REQUESTS,
        errorRate: ALERT_ERROR_RATE,
        p95Ms: ALERT_P95_MS,
      },
      timestamp: new Date(now).toISOString(),
    });
  }
}

export function getMetricsSnapshot() {
  return computeStats();
}

export function getRecentMetrics(limit: number = 200) {
  const now = Date.now();
  trimOldMetrics(now);
  return metrics.slice(-limit);
}
