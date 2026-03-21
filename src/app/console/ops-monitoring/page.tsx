'use client';

import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const res = await fetch('/api/metrics?limit=500');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load metrics');
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    };

    load();
    interval = setInterval(load, 5000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

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

  return (
    <div>
      <PageHeader
        title="Operations Monitoring"
        subtitle="Grouped, filtered, and exportable API metrics (auto-refresh every 5s)"
        badge="Ops"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Window" value={`${windowMin} min`} />
        <StatCard label="Requests" value={summary.total} />
        <StatCard label="Errors" value={summary.errors} trend={summary.errors > 0 ? 'down' : 'neutral'} />
        <StatCard label="Error Rate" value={`${errorRatePct}%`} trend={summary.errorRate > 0.1 ? 'down' : 'neutral'} />
        <StatCard label="p95 (ms)" value={Math.round(summary.p95)} trend={summary.p95 > 2000 ? 'down' : 'neutral'} />
        <StatCard
          label="Last Alert"
          value={summary.lastAlertAt ? new Date(summary.lastAlertAt).toLocaleString() : 'None'}
        />
      </div>

      <div className="glass-card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[180px]">
            <label className="block text-sm text-white/60 mb-2">Time Range</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value) as TimeRange)}
            >
              <option value={5}>Last 5 min</option>
              <option value={15}>Last 15 min</option>
              <option value={60}>Last 60 min</option>
            </select>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-sm text-white/60 mb-2">Route</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
            >
              {routeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px]">
            <label className="block text-sm text-white/60 mb-2">Method</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              {methodOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px]">
            <label className="block text-sm text-white/60 mb-2">Status</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="2xx">2xx</option>
              <option value="4xx">4xx</option>
              <option value="5xx">5xx</option>
            </select>
          </div>

          <div className="min-w-[220px]">
            <label className="block text-sm text-white/60 mb-2">Search Route</label>
            <input
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="e.g. markets, search"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="block text-sm text-white/60 mb-2">Group By</label>
            <select
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="none">None</option>
              <option value="route">Route</option>
              <option value="method">Method</option>
              <option value="status">Status</option>
            </select>
          </div>

          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded font-semibold"
          >
            Export CSV
          </button>
        </div>
      </div>

      {groupBy !== 'none' && (
        <div className="glass-card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Grouped Summary</h3>
            <div className="text-xs text-white/50">Groups: {grouped.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Count</th>
                  <th>Error Rate</th>
                  <th>Avg (ms)</th>
                  <th>p95 (ms)</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <tr key={g.key}>
                    <td className="font-mono">{g.key}</td>
                    <td>{g.count}</td>
                    <td className={g.errorRate > 0.1 ? 'text-red-400' : 'text-green-400'}>
                      {(g.errorRate * 100).toFixed(1)}%
                    </td>
                    <td className="font-mono">{Math.round(g.avg)}</td>
                    <td className="font-mono">{Math.round(g.p95)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Requests</h3>
          <div className="text-xs text-white/50">Filtered: {filtered.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table text-sm">
            <thead>
              <tr>
                <th>Time</th>
                <th>Route</th>
                <th>Method</th>
                <th>Status</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice().reverse().map((m, idx) => (
                <tr key={`${m.timestamp}-${idx}`}>
                  <td className="text-white/60">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  <td className="font-mono">{m.route}</td>
                  <td>{m.method}</td>
                  <td className={m.status >= 500 ? 'text-red-400' : 'text-green-400'}>{m.status}</td>
                  <td className="font-mono">{Math.round(m.durationMs)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
