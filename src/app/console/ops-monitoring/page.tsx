'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage, StatCard } from '@/components/common';

interface Metric {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

interface MetricsResponse {
  summary: {
    windowMs: number;
    total: number;
    errors: number;
    errorRate: number;
    p95: number;
    lastAlertAt: number;
  };
  recent: Metric[];
}

type GroupBy = 'none' | 'route' | 'method' | 'status';

type StatusFilter = 'all' | '2xx' | '4xx' | '5xx';

type TimeRange = 5 | 15 | 60;

/** Consistent local display with seconds (avoids mixed locale formats). */
function formatMetricTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function statusTone(status: number): string {
  if (status >= 500) return 'text-red-400 font-semibold';
  if (status >= 400) return 'text-amber-400 font-medium';
  return 'text-emerald-400';
}

function durationTone(ms: number): string {
  if (ms >= 10_000) return 'text-red-400 font-semibold';
  if (ms >= 5000) return 'text-red-400/90';
  if (ms >= 2000) return 'text-amber-400';
  return 'text-emerald-400/90';
}

function errorRateTone(rate: number): string {
  if (rate >= 0.5) return 'text-red-400 font-semibold';
  if (rate >= 0.1) return 'text-amber-400';
  return 'text-emerald-400';
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

export default function MonitoringPage() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [routeFilter, setRouteFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('route');
  const [timeRange, setTimeRange] = useState<TimeRange>(15);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics?limit=500');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load metrics');
      setData(json);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const run = () => {
      load();
      interval = setInterval(load, 5000);
    };
    run();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [load]);

  const recent = data?.recent || [];

  const routeOptions = useMemo(() => {
    const set = new Set(recent.map(r => r.route));
    return ['all', ...Array.from(set).sort()];
  }, [recent]);

  const methodOptions = useMemo(() => {
    const set = new Set(recent.map(r => r.method));
    return ['all', ...Array.from(set).sort()];
  }, [recent]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeMs = timeRange * 60 * 1000;

    return recent.filter((m) => {
      if (now - m.timestamp > rangeMs) return false;
      if (routeFilter !== 'all' && m.route !== routeFilter) return false;
      if (methodFilter !== 'all' && m.method !== methodFilter) return false;
      if (statusFilter === '2xx' && (m.status < 200 || m.status >= 300)) return false;
      if (statusFilter === '4xx' && (m.status < 400 || m.status >= 500)) return false;
      if (statusFilter === '5xx' && m.status < 500) return false;
      if (searchText.trim() && !m.route.toLowerCase().includes(searchText.trim().toLowerCase())) return false;
      return true;
    });
  }, [recent, routeFilter, methodFilter, statusFilter, searchText, timeRange]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [] as Array<{ key: string; count: number; errors: number; errorRate: number; p95: number; avg: number }>;

    const map = new Map<string, Metric[]>();
    filtered.forEach((m) => {
      const key = groupBy === 'route'
        ? m.route
        : groupBy === 'method'
          ? m.method
          : `${Math.floor(m.status / 100)}xx`;
      const list = map.get(key) || [];
      list.push(m);
      map.set(key, list);
    });

    return Array.from(map.entries()).map(([key, items]) => {
      const errors = items.filter(i => i.status >= 500).length;
      const durations = items.map(i => i.durationMs);
      const avg = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);
      return {
        key,
        count: items.length,
        errors,
        errorRate: items.length ? errors / items.length : 0,
        p95: percentile(durations, 0.95),
        avg,
      };
    }).sort((a, b) => b.count - a.count);
  }, [filtered, groupBy]);

  const exportCsv = () => {
    const headers = ['timestamp', 'route', 'method', 'status', 'durationMs'];
    const rows = filtered.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.route,
      m.method,
      String(m.status),
      String(Math.round(m.durationMs)),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metrics-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner text="Loading metrics..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No metrics available" />;

  const { summary } = data;
  const errorRatePct = (summary.errorRate * 100).toFixed(1);
  const windowMin = Math.round(summary.windowMs / 60000);
  const p95Rounded = Math.round(summary.p95);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Operations Monitoring"
          subtitle="Grouped, filtered, and exportable API metrics (auto-refresh every 5s)"
          badge="Ops"
        />
        <button
          type="button"
          onClick={() => load()}
          className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          aria-label="Refresh metrics"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Window" value={`${windowMin} min`} subValue="Rolling buffer" />
        <StatCard label="Requests" value={summary.total} />
        <StatCard
          label="5xx errors"
          value={summary.errors}
          valueClassName={summary.errors > 0 ? 'text-red-400' : 'text-emerald-400'}
        />
        <StatCard
          label="Error rate"
          value={`${errorRatePct}%`}
          subValue="Share of 5xx in window"
          valueClassName={errorRateTone(summary.errorRate)}
        />
        <StatCard
          label="p95 latency"
          value={`${p95Rounded} ms`}
          subValue="95th percentile; includes network + handler"
          valueClassName={
            summary.p95 >= 5000 ? 'text-red-400' : summary.p95 >= 2000 ? 'text-amber-400' : 'text-emerald-400'
          }
        />
        <StatCard
          label="Last webhook alert"
          value={summary.lastAlertAt ? formatMetricTime(summary.lastAlertAt) : 'None'}
          subValue="Ops threshold alerts only"
          valueClassName="text-white/90 whitespace-nowrap"
        />
      </div>

      <div className="glass-card mb-6">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Time range</label>
              <select
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value) as TimeRange)}
              >
                <option value={5}>Last 5 min</option>
                <option value={15}>Last 15 min</option>
                <option value={60}>Last 60 min</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Route</label>
              <select
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
              >
                {routeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Method</label>
              <select
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                {methodOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Status</label>
              <select
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All</option>
                <option value="2xx">2xx</option>
                <option value="4xx">4xx</option>
                <option value="5xx">5xx</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Search route</label>
              <input
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/55 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="e.g. markets, search"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Group by</label>
              <select
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              >
                <option value="none">None</option>
                <option value="route">Route</option>
                <option value="method">Method</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
            <span className="mr-auto text-xs text-white/55">
              Export uses the <strong className="text-white/75">filtered</strong> rows below ({filtered.length}).
            </span>
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {groupBy !== 'none' && (
        <div className="glass-card mb-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">Grouped summary</h3>
            <div className="text-sm text-white/70">Groups: {grouped.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th>Group</th>
                  <th className="th-num">Count</th>
                  <th className="th-num">Error rate</th>
                  <th className="th-num">Avg</th>
                  <th className="th-num">p95</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => {
                  const bad = g.errorRate >= 0.5 || g.p95 >= 10_000;
                  const warn = !bad && (g.errorRate >= 0.1 || g.p95 >= 2000);
                  const rowBg = bad
                    ? 'bg-red-950/40'
                    : warn
                      ? 'bg-amber-950/25'
                      : '';
                  const textClass = bad ? 'text-red-100' : '';
                  return (
                    <tr key={g.key} className={rowBg}>
                      <td className={`font-mono ${textClass}`}>{g.key}</td>
                      <td className={`td-num ${textClass}`}>{g.count}</td>
                      <td className={`td-num ${bad ? 'text-red-200' : errorRateTone(g.errorRate)}`}>
                        {(g.errorRate * 100).toFixed(1)}%
                      </td>
                      <td className={`font-mono td-num ${bad ? 'text-red-100' : durationTone(g.avg)}`}>
                        {Math.round(g.avg)} ms
                      </td>
                      <td className={`font-mono td-num ${bad ? 'text-red-100' : durationTone(g.p95)}`}>
                        {Math.round(g.p95)} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">Recent requests</h3>
          <div className="text-sm font-medium text-white/90">
            Filtered: <span className="tabular-nums text-sky-300">{filtered.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[640px] text-sm">
            <thead>
              <tr>
                <th>Time (local)</th>
                <th>Route</th>
                <th>Method</th>
                <th className="th-num">Status</th>
                <th className="th-num">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice().reverse().map((m, idx) => {
                const slow = m.durationMs >= 2000;
                const isError = m.status >= 500;
                const verySlow = m.durationMs >= 10_000 || isError;
                const rowBg = verySlow ? 'bg-red-950/40' : slow ? 'bg-amber-950/25' : '';
                const textContrast = isError ? 'text-red-100' : '';
                return (
                  <tr key={`${m.timestamp}-${idx}`} className={rowBg}>
                    <td className={`whitespace-nowrap ${isError ? 'text-red-100' : 'text-white/75'}`}>{formatMetricTime(m.timestamp)}</td>
                    <td className={`font-mono text-xs ${isError ? 'text-red-100' : ''}`}>{m.route}</td>
                    <td className={textContrast}>{m.method}</td>
                    <td className={`td-num ${statusTone(m.status)} ${isError ? 'text-red-200' : ''}`}>{m.status}</td>
                    <td className={`font-mono td-num ${durationTone(m.durationMs)} ${isError ? 'text-red-100' : ''}`}>
                      {Math.round(m.durationMs)} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
