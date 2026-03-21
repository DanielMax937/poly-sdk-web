'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const res = await fetch('/api/futures/alerts?limit=100');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load monitor status');
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
    interval = setInterval(load, 10000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const startMonitor = async () => {
    try {
      const keywords = keywordsInput.split(',').map(k => k.trim()).filter(Boolean);
      const res = await fetch('/api/futures/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, intervalMs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to start monitor');
      setData({ status: json.status, alerts: data?.alerts || [] });
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
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <LoadingSpinner text="Loading futures monitor..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <ErrorMessage message="No monitor data" />;

  const { status, alerts } = data;

  return (
    <div>
      <PageHeader
        title="Futures Alerts"
        subtitle="Server-side tracking with movement and insider alerts"
        badge="Alerts"
      />

      <div className="glass-card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[240px]">
            <label className="block text-sm text-white/60 mb-2">Keywords (comma separated)</label>
            <input
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="gold, oil, bitcoin"
            />
          </div>

          <div className="min-w-[160px]">
            <label className="block text-sm text-white/60 mb-2">Interval (ms)</label>
            <input
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
              type="number"
              min={10000}
              step={10000}
              value={intervalMs}
              onChange={(e) => setIntervalMs(parseInt(e.target.value, 10))}
            />
          </div>

          <button
            onClick={startMonitor}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded font-semibold"
          >
            Start
          </button>
          <button
            onClick={stopMonitor}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded font-semibold"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Running" value={status.running ? 'Yes' : 'No'} />
        <StatCard label="Interval" value={`${Math.round(status.intervalMs / 1000)}s`} />
        <StatCard label="Keywords" value={status.keywords.length} />
        <StatCard label="Alerts" value={status.alertsCount} />
        <StatCard
          label="Last Run"
          value={status.lastRunAt ? new Date(status.lastRunAt).toLocaleString() : 'Never'}
        />
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Alerts</h3>
          <div className="text-xs text-white/50">{alerts.length} alerts</div>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="text-white/50">No alerts yet.</div>
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
