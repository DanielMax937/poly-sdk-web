'use client';

import { useEffect, useState } from 'react';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { PositionsList } from '@/components/PositionsList';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/common';

interface LeaderboardEntry {
    rank: number;
    address: string;
    pnl: number;
    volume: number;
    positions?: number;
    trades?: number;
    userName?: string;
    profileImage?: string;
}

interface Position {
    conditionId: string;
    title: string;
    outcome: string;
    size: number;
    avgPrice: number;
    curPrice?: number;
    cashPnl?: number;
    percentPnl?: number;
}

interface Activity {
    type: string;
    side: string;
    size: number;
    price: number;
    usdcSize?: number;
    outcome: string;
    timestamp: number;
}

export default function SmartMoneyPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch('/api/leaderboard?limit=10');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setEntries(data.leaderboard?.entries || []);
                setLoading(false);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    async function selectTrader(address: string) {
        setSelectedTrader(address);
        setLoadingDetails(true);

        try {
            // Fetch positions
            const posRes = await fetch(`/api/wallet?address=${address}&type=positions&limit=10`);
            const posData = await posRes.json();
            setPositions(posData.positions || []);

            // Fetch activity
            const actRes = await fetch(`/api/wallet?address=${address}&type=activity&limit=10`);
            const actData = await actRes.json();
            setActivity(actData.activity || []);
        } catch (err) {
            console.error('Error fetching trader details:', err);
        } finally {
            setLoadingDetails(false);
        }
    }

    if (loading) return <LoadingSpinner text="Fetching leaderboard..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Smart Money Analysis"
                subtitle="Track top traders, their positions, and activity"
                badge="Example 02"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leaderboard */}
                <div>
                    <LeaderboardTable
                        entries={entries}
                        onSelectTrader={selectTrader}
                        selectedAddress={selectedTrader || undefined}
                    />
                </div>

                {/* Trader Details */}
                <div className="space-y-4">
                    {selectedTrader && (
                        <>
                            <div className="glass-card">
                                <h3 className="text-lg font-semibold mb-2 gradient-text">
                                    Trader: {selectedTrader.slice(0, 8)}...
                                </h3>
                                <p className="text-sm text-white/50">
                                    Click on the tables below to explore positions and activity
                                </p>
                            </div>

                            <PositionsList positions={positions} loading={loadingDetails} />

                            {/* Activity */}
                            <div className="glass-card">
                                <h3 className="text-lg font-semibold mb-4 gradient-text">
                                    Recent Activity ({activity.length})
                                </h3>
                                {loadingDetails ? (
                                    <div className="flex justify-center py-8">
                                        <div className="spinner" />
                                    </div>
                                ) : activity.length === 0 ? (
                                    <p className="text-white/50 text-center py-8">No activity found</p>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {activity.map((act, index) => (
                                            <div
                                                key={index}
                                                className="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`badge ${act.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                                                        {act.side}
                                                    </span>
                                                    <span className="text-white/70">{act.outcome}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono">{act.size.toFixed(2)} @ {act.price.toFixed(4)}</div>
                                                    <div className="text-xs text-white/50">
                                                        {new Date(act.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {!selectedTrader && (
                        <div className="glass-card text-center py-12">
                            <p className="text-white/50">Select a trader to view their positions and activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
