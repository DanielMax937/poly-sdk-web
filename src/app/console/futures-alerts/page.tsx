'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage, StatCard } from '@/components/common';

interface FuturesAlert {
  id: string;
  timestamp: number;
  conditionId: string;
  question: string;
  keyword: string;
  type: 'movement' | 'insider';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface MonitorStatus {
  running: boolean;
  intervalMs: number;
  keywords: string[];
  lastRunAt: number | null;
  alertsCount: number;
}

interface ApiResponse {
  status: MonitorStatus;
  alerts: FuturesAlert[];
}

export default function FuturesAlertsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keywordsInput, setKeywordsInput] = useState('gold, silver, oil, bitcoin, ethereum');
  const [intervalMs, setIntervalMs] = useState(60000);

  const initialSyncDone = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/futures/alerts?limit=100', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load monitor status');
      setData(json);
      setError(null);
      setLoading(false);
      if (!initialSyncDone.current && json.status) {
        initialSyncDone.current = true;
        setKeywordsInput(json.status.keywords?.join(', ') ?? '');
        setIntervalMs(json.status.intervalMs ?? 60000);
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await load();
    };

    run();
    const interval = setInterval(run, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [load]);

  const startMonitor = async () => {
    try {
      const keywords = keywordsInput.split(/[,，]/).map(k => k.trim()).filter(Boolean);
      const res = await fetch('/api/futures/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, intervalMs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start monitor');
      setData({ status: json.status, alerts: data?.alerts || [] });
      setKeywordsInput(json.status.keywords?.join(', ') ?? '');
      setIntervalMs(json.status.intervalMs ?? 60000);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const stopMonitor = async () => {
    try {
      const res = await fetch('/api/futures/monitor', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to stop monitor');
      setData({ status: json.status, alerts: data?.alerts || [] });
      setKeywordsInput(json.status.keywords?.join(', ') ?? '');
      setIntervalMs(json.status.intervalMs ?? 60000);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading futures monitor..." />;
  if (error && !data) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No monitor data" />;

  const { status, alerts } = data;

  return (
    <div>
      <PageHeader
        title="Futures Alerts"
        subtitle="Server-side tracking with movement and insider alerts"
        badge="Alerts"
      />

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="glass-card mb-6">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Keywords (comma separated)</label>
              <input
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/55 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="gold, oil, bitcoin"
              />
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm text-white/75">Interval (seconds)</label>
              <input
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/55 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                type="number"
                min={10}
                step={10}
                value={Math.round(intervalMs / 1000)}
                onChange={(e) => setIntervalMs(Math.max(10000, parseInt(e.target.value || '60', 10) * 1000))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={startMonitor}
              aria-pressed={status.running}
              title={status.running ? 'Click to apply new keywords/interval (reconfigures monitor)' : undefined}
              className={`rounded-lg px-5 py-2.5 font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                status.running
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400/60'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {status.running ? 'Apply (reconfig)' : 'Start'}
            </button>
            <button
              type="button"
              onClick={stopMonitor}
              aria-pressed={!status.running}
              className={`rounded-lg px-5 py-2.5 font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                !status.running
                  ? 'bg-zinc-600 text-white/90 hover:bg-zinc-500'
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Running"
          value={status.running ? 'Yes' : 'No'}
          valueClassName={status.running ? 'text-emerald-400' : 'text-white/80'}
        />
        <StatCard label="Interval" value={`${Math.round(status.intervalMs / 1000)} seconds`} />
        <StatCard
          label="Keywords"
          value={status.keywords.length}
          subValue={status.keywords.length > 0 ? status.keywords.slice(0, 5).join(', ') + (status.keywords.length > 5 ? '…' : '') : 'None'}
        />
        <StatCard label="Total alerts (stored)" value={status.alertsCount} />
        <StatCard
          label="Last run"
          value={status.lastRunAt ? new Date(status.lastRunAt).toLocaleString() : 'Never'}
          subValue="Local browser time"
        />
      </div>

      <div className="glass-card">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          <div className="text-sm font-medium tabular-nums text-white/80">
            <span className="text-sky-300">{alerts.length}</span> alerts loaded
          </div>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] py-12 text-center text-white/80">
              No alerts yet. Start the monitor and wait for the next cycle.
            </div>
          )}
          {alerts.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded border ${
                a.severity === 'high'
                  ? 'border-red-500/40 bg-red-500/10'
                  : a.severity === 'medium'
                  ? 'border-yellow-500/40 bg-yellow-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-white/60">{new Date(a.timestamp).toLocaleString()}</div>
                  <div className="font-semibold">{a.question}</div>
                  <div className="text-xs text-white/50">Keyword: {a.keyword} · Type: {a.type}</div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-white/10">
                  {a.severity.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-white/70 mt-2">{a.message}</div>
              <div className="text-xs text-white/40 mt-1">{a.conditionId}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
