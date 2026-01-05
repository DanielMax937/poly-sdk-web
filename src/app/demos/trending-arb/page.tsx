'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/common';

interface GammaMarket {
    id: string;
    conditionId: string;
    question: string;
    volume24hr?: number;
    outcomePrices: number[];
}

interface ArbResult {
    market: GammaMarket;
    arbitrage: { type: string; profit: number; action: string } | null;
    askSum?: number;
}

export default function TrendingArbPage() {
    const [markets, setMarkets] = useState<GammaMarket[]>([]);
    const [results, setResults] = useState<ArbResult[]>([]);
    const [monitoring, setMonitoring] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMarkets() {
            try {
                const res = await fetch('/api/markets?limit=10');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setMarkets(data.markets || []);
                setLoading(false);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        }
        fetchMarkets();
    }, []);

    async function scanOnce() {
        const newResults: ArbResult[] = [];

        for (const market of markets) {
            try {
                // Get orderbook for ask sum
                const obRes = await fetch(`/api/orderbook?conditionId=${market.conditionId}`);
                const obData = await obRes.json();

                // Get arbitrage
                const arbRes = await fetch(`/api/arbitrage?conditionId=${market.conditionId}&threshold=0.001`);
                const arbData = await arbRes.json();

                newResults.push({
                    market,
                    arbitrage: arbData.arbitrage || null,
                    askSum: obData.orderbook?.summary?.askSum,
                });
            } catch (err) {
                newResults.push({
                    market,
                    arbitrage: null,
                });
            }
        }

        setResults(newResults);
        setLastUpdate(new Date());
    }

    useEffect(() => {
        if (!monitoring || markets.length === 0) return;

        // Initial scan
        scanOnce();

        // Set up interval for continuous monitoring
        const interval = setInterval(scanOnce, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [monitoring, markets]);

    const arbOpportunities = results.filter((r) => r.arbitrage);

    if (loading) return <LoadingSpinner text="Loading trending markets..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Trending Arb Monitor"
                subtitle="Continuous monitoring of top markets for arbitrage"
                badge="Example 12"
            />

            {/* Controls */}
            <div className="glass-card mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold">Monitor Status</h3>
                        <p className="text-sm text-white/50">
                            {monitoring ? 'Monitoring active (updates every 30s)' : 'Click to start monitoring'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {lastUpdate && (
                            <span className="text-sm text-white/50">
                                Last update: {lastUpdate.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={() => setMonitoring(!monitoring)}
                            className={monitoring ? 'btn-secondary' : 'btn-primary'}
                        >
                            {monitoring ? '⏹ Stop' : '▶️ Start Monitoring'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Arbitrage Alerts */}
            {arbOpportunities.length > 0 && (
                <div className="glass-card border-green-500/30 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">
                        🚨 Live Arbitrage Alerts ({arbOpportunities.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {arbOpportunities.map((result, index) => (
                            <div key={index} className="p-4 bg-green-500/10 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium line-clamp-1 flex-1">
                                        {result.market.question}
                                    </h4>
                                    <span className="badge badge-green ml-2">
                                        +{((result.arbitrage?.profit || 0) * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-white/50">24h Vol:</span>
                                    <span>${(result.market.volume24hr || 0).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-white/60 mt-2">
                                    {result.arbitrage?.action}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Markets */}
            <div className="glass-card">
                <h3 className="text-lg font-semibold mb-4 gradient-text">
                    Trending Markets ({markets.length})
                </h3>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th>24h Volume</th>
                                <th>YES Price</th>
                                <th>NO Price</th>
                                <th>Ask Sum</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {markets.map((market) => {
                                const result = results.find((r) => r.market.id === market.id);
                                return (
                                    <tr key={market.id}>
                                        <td className="max-w-xs">
                                            <span className="line-clamp-1">{market.question}</span>
                                        </td>
                                        <td className="font-mono text-white/70">
                                            ${(market.volume24hr || 0).toLocaleString()}
                                        </td>
                                        <td className="font-mono text-green-400">
                                            {(market.outcomePrices[0] * 100).toFixed(1)}¢
                                        </td>
                                        <td className="font-mono text-red-400">
                                            {(market.outcomePrices[1] * 100).toFixed(1)}¢
                                        </td>
                                        <td className="font-mono">
                                            {result?.askSum?.toFixed(4) || '-'}
                                        </td>
                                        <td>
                                            {result?.arbitrage ? (
                                                <span className="badge badge-green">
                                                    {result.arbitrage.type.toUpperCase()}
                                                </span>
                                            ) : (
                                                <span className="text-white/50">-</span>
                                            )}
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
