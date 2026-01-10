'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface Trade {
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
    timestamp: number;
    outcome: string;
}

export default function TradesPage() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(100);

    useEffect(() => {
        loadTrades();
    }, [limit]);

    async function loadTrades() {
        setLoading(true);
        try {
            const res = await fetch(`/api/trades?limit=${limit}`);
            const data = await res.json();
            setTrades(data.trades || []);
        } catch (error) {
            console.error('Failed to load trades:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatTime(timestamp: number) {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    }

    return (
        <div>
            <PageHeader
                title="Recent Trades"
                subtitle="Live trade feed from Polymarket"
                badge="Trades"
            />

            {/* Controls */}
            <div className="glass-card mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm text-white/60">Show:</label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                    >
                        <option value={50}>50 trades</option>
                        <option value={100}>100 trades</option>
                        <option value={200}>200 trades</option>
                        <option value={500}>500 trades</option>
                    </select>
                    <button onClick={loadTrades} className="btn-secondary text-sm ml-auto">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Trades Table */}
            {loading ? (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading trades...</p>
                </div>
            ) : (
                <div className="glass-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-white/60 border-b border-white/10">
                            <tr>
                                <th className="text-left py-3 px-3">Time</th>
                                <th className="text-left py-3 px-3">Outcome</th>
                                <th className="text-center py-3 px-3">Side</th>
                                <th className="text-right py-3 px-3">Price</th>
                                <th className="text-right py-3 px-3">Size</th>
                                <th className="text-right py-3 px-3">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade, idx) => (
                                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-2 px-3 text-white/60 text-xs">
                                        {formatTime(trade.timestamp)}
                                    </td>
                                    <td className="py-2 px-3">
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded">
                                            {trade.outcome}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <span className={`font-bold ${trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.side}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono">
                                        {(trade.price * 100).toFixed(1)}¢
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono">
                                        {trade.size.toLocaleString()}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-white/80">
                                        ${(trade.price * trade.size).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {trades.length === 0 && (
                        <div className="text-center py-8 text-white/60">
                            No trades found
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            {trades.length > 0 && (
                <div className="glass-card mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-sm text-white/60 mb-1">Total Trades</div>
                            <div className="text-2xl font-bold">{trades.length}</div>
                        </div>
                        <div>
                            <div className="text-sm text-white/60 mb-1">Buys</div>
                            <div className="text-2xl font-bold text-green-400">
                                {trades.filter(t => t.side === 'BUY').length}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-white/60 mb-1">Sells</div>
                            <div className="text-2xl font-bold text-red-400">
                                {trades.filter(t => t.side === 'SELL').length}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
