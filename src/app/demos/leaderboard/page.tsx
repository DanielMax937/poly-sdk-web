'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface LeaderboardEntry {
    rank: number;
    address: string;
    pnl: number;
    volume: number;
    userName?: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('ALL');
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        loadLeaderboard();
    }, [timePeriod, limit]);

    async function loadLeaderboard() {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?timePeriod=${timePeriod}&limit=${limit}`);
            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatAddress(address: string) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    function formatPnl(pnl: number) {
        const formatted = pnl >= 0 ? `+$${pnl.toLocaleString()}` : `-$${Math.abs(pnl).toLocaleString()}`;
        return formatted;
    }

    return (
        <div>
            <PageHeader
                title="Leaderboard"
                subtitle="Top traders on Polymarket"
                badge="Rankings"
            />

            {/* Controls */}
            <div className="glass-card mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <label className="text-sm text-white/60">Time Period:</label>
                    <select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                    >
                        <option value="DAY">24 Hours</option>
                        <option value="WEEK">Week</option>
                        <option value="MONTH">Month</option>
                        <option value="ALL">All Time</option>
                    </select>

                    <label className="text-sm text-white/60 ml-4">Show:</label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                    >
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                        <option value={50}>Top 50</option>
                        <option value={100}>Top 100</option>
                    </select>

                    <button onClick={loadLeaderboard} className="btn-secondary text-sm ml-auto">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Leaderboard Table */}
            {loading ? (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading leaderboard...</p>
                </div>
            ) : (
                <div className="glass-card overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-white/60 border-b border-white/10">
                            <tr>
                                <th className="text-left py-3 px-4">Rank</th>
                                <th className="text-left py-3 px-4">Trader</th>
                                <th className="text-right py-3 px-4">P&L</th>
                                <th className="text-right py-3 px-4">Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr key={entry.address} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-4">
                                        <span className={`font-bold ${entry.rank <= 3 ? 'text-yellow-400' : ''}`}>
                                            #{entry.rank}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>
                                            {entry.userName && <div className="font-medium">{entry.userName}</div>}
                                            <code className="text-xs text-white/60">{formatAddress(entry.address)}</code>
                                        </div>
                                    </td>
                                    <td className={`py-3 px-4 text-right font-mono ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatPnl(entry.pnl)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono">
                                        ${(entry.volume / 1000).toFixed(1)}K
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
