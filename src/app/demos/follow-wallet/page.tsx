'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/common';
import { PositionsList } from '@/components/PositionsList';

interface LeaderboardEntry {
    rank: number;
    address: string;
    pnl: number;
    volume: number;
}

interface Position {
    conditionId: string;
    title: string;
    outcome: string;
    size: number;
    avgPrice: number;
    curPrice?: number;
    cashPnl?: number;
    currentValue?: number;
}

interface PositionTracker {
    position: Position;
    cumulativeSellAmount: number;
    sellRatio: number;
    peakValue: number;
    signal: 'exit' | 'hold' | 'strong';
}

export default function FollowWalletPage() {
    const [traders, setTraders] = useState<LeaderboardEntry[]>([]);
    const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
    const [positions, setPositions] = useState<Position[]>([]);
    const [trackers, setTrackers] = useState<PositionTracker[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTraders() {
            try {
                const res = await fetch('/api/leaderboard?limit=5');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setTraders(data.leaderboard?.entries || []);
                setLoading(false);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        }
        fetchTraders();
    }, []);

    async function analyzeTrader(address: string) {
        setSelectedTrader(address);
        setAnalyzing(true);
        setTrackers([]);

        try {
            // Fetch positions
            const posRes = await fetch(`/api/wallet?address=${address}&type=positions&limit=10`);
            const posData = await posRes.json();
            const fetchedPositions = posData.positions || [];
            setPositions(fetchedPositions);

            // Simulate sell activity analysis
            const results: PositionTracker[] = fetchedPositions.slice(0, 5).map((pos: Position) => {
                // Simulated data (in real implementation, would fetch activity)
                const currentValue = pos.currentValue || pos.size * (pos.curPrice || pos.avgPrice);
                const simulatedSellAmount = Math.random() * currentValue * 0.4;
                const peakValue = currentValue + simulatedSellAmount;
                const sellRatio = peakValue > 0 ? simulatedSellAmount / peakValue : 0;

                return {
                    position: pos,
                    cumulativeSellAmount: simulatedSellAmount,
                    sellRatio,
                    peakValue,
                    signal: sellRatio >= 0.3 ? 'exit' : sellRatio < 0.1 ? 'strong' : 'hold',
                };
            });

            setTrackers(results);
        } catch (err) {
            console.error('Error analyzing trader:', err);
        } finally {
            setAnalyzing(false);
        }
    }

    const exitSignals = trackers.filter((t) => t.signal === 'exit');
    const strongHolds = trackers.filter((t) => t.signal === 'strong');

    if (loading) return <LoadingSpinner text="Loading traders..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Follow Wallet Strategy"
                subtitle="Track smart money positions and detect exit signals"
                badge="Example 05"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trader Selection */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Top Traders</h3>
                    <div className="space-y-2">
                        {traders.map((trader) => (
                            <button
                                key={trader.address}
                                onClick={() => analyzeTrader(trader.address)}
                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTrader === trader.address
                                        ? 'bg-blue-500/20 border border-blue-500/50'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-yellow-400 mr-2">#{trader.rank}</span>
                                        <span className="font-mono text-sm">
                                            {trader.address.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <span className="text-green-400 text-sm">
                                        ${trader.pnl.toLocaleString()}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Analysis Results */}
                <div className="lg:col-span-2 space-y-4">
                    {analyzing && <LoadingSpinner text="Analyzing positions..." />}

                    {selectedTrader && !analyzing && (
                        <>
                            {/* Exit Signals */}
                            {exitSignals.length > 0 && (
                                <div className="glass-card border-red-500/30">
                                    <h3 className="text-lg font-semibold mb-4 text-red-400">
                                        🚨 Exit Signals ({exitSignals.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {exitSignals.map((tracker, idx) => (
                                            <div key={idx} className="p-3 bg-red-500/10 rounded-lg">
                                                <h4 className="font-medium line-clamp-1">{tracker.position.title}</h4>
                                                <div className="flex justify-between text-sm mt-2">
                                                    <span className="text-white/60">Sell Ratio</span>
                                                    <span className="text-red-400 font-bold">
                                                        {(tracker.sellRatio * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-white/50 mt-1">
                                                    Trader has sold {(tracker.sellRatio * 100).toFixed(0)}% of peak position
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strong Holds */}
                            {strongHolds.length > 0 && (
                                <div className="glass-card border-green-500/30">
                                    <h3 className="text-lg font-semibold mb-4 text-green-400">
                                        💪 Strong Holds ({strongHolds.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {strongHolds.map((tracker, idx) => (
                                            <div key={idx} className="p-3 bg-green-500/10 rounded-lg">
                                                <h4 className="font-medium line-clamp-1">{tracker.position.title}</h4>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className={`text-sm ${tracker.position.outcome === 'Yes' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {tracker.position.outcome}
                                                    </span>
                                                    <span className="text-sm text-white/60">
                                                        Sell Ratio: {(tracker.sellRatio * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Positions */}
                            <PositionsList positions={positions} />
                        </>
                    )}

                    {!selectedTrader && (
                        <div className="glass-card text-center py-12">
                            <p className="text-white/50">Select a trader to analyze their positions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
