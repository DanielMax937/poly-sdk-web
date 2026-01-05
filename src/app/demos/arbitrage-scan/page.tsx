'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage, StatCard } from '@/components/common';

interface ArbitrageOpportunity {
    market: { question: string; slug: string; conditionId: string };
    type: 'long' | 'short';
    profit: number;
    action: string;
    gasCost: number;
    netProfit: number;
}

interface GammaMarket {
    id: string;
    conditionId: string;
    question: string;
    slug: string;
}

export default function ArbitrageScanPage() {
    const [markets, setMarkets] = useState<GammaMarket[]>([]);
    const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMarkets() {
            try {
                const res = await fetch('/api/markets?limit=20');
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

    async function startScan() {
        setScanning(true);
        setOpportunities([]);
        setProgress(0);

        const found: ArbitrageOpportunity[] = [];
        const estimatedGasCost = 0.50; // Estimated gas in USD

        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            setProgress(Math.round(((i + 1) / markets.length) * 100));

            try {
                const arbRes = await fetch(`/api/arbitrage?conditionId=${market.conditionId}&threshold=0.001`);
                const arbData = await arbRes.json();

                if (arbData.arbitrage) {
                    const netProfit = arbData.arbitrage.profit * 100 - estimatedGasCost; // Assuming $100 position
                    found.push({
                        market,
                        type: arbData.arbitrage.type,
                        profit: arbData.arbitrage.profit,
                        action: arbData.arbitrage.action,
                        gasCost: estimatedGasCost,
                        netProfit,
                    });
                }
            } catch (err) {
                console.error(`Error scanning ${market.slug}:`, err);
            }
        }

        setOpportunities(found);
        setScanning(false);
    }

    if (loading) return <LoadingSpinner text="Loading markets..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Live Arbitrage Scan"
                subtitle="Real-time scanner for arbitrage opportunities"
                badge="Example 11"
            />

            {/* Stats & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Markets to Scan" value={markets.length} />
                <StatCard
                    label="Opportunities Found"
                    value={opportunities.length}
                    trend={opportunities.length > 0 ? 'up' : 'neutral'}
                />
                <StatCard label="Est. Gas Cost" value="$0.50" subValue="per transaction" />
                <div className="glass-card flex items-center justify-center">
                    <button
                        onClick={startScan}
                        disabled={scanning}
                        className="btn-primary disabled:opacity-50"
                    >
                        {scanning ? `Scanning... ${progress}%` : '🔍 Start Scan'}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {scanning && (
                <div className="glass-card mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span>Scanning markets...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Opportunities */}
            {opportunities.length > 0 && (
                <div className="glass-card mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">
                        🎯 Arbitrage Opportunities ({opportunities.length})
                    </h3>

                    <div className="space-y-4">
                        {opportunities.map((opp, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-lg border border-green-500/30">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-medium line-clamp-1">{opp.market.question}</h4>
                                        <p className="text-sm text-white/50">{opp.market.slug}</p>
                                    </div>
                                    <span className={`badge ${opp.type === 'long' ? 'badge-green' : 'badge-blue'}`}>
                                        {opp.type.toUpperCase()} ARB
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-white/50">Gross Profit</span>
                                        <p className="text-green-400 font-bold">
                                            {(opp.profit * 100).toFixed(3)}%
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-white/50">Gas Cost (est.)</span>
                                        <p className="text-yellow-400">${opp.gasCost.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <span className="text-white/50">Net Profit ($100)</span>
                                        <p className={opp.netProfit > 0 ? 'text-green-400' : 'text-red-400'}>
                                            ${opp.netProfit.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-white/60 mt-3">{opp.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pre-flight Checks */}
            <div className="glass-card">
                <h3 className="text-lg font-semibold mb-4 gradient-text">Pre-flight Checks</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-400">✓</span>
                            <span className="font-semibold">API Connection</span>
                        </div>
                        <p className="text-xs text-white/50">Connected to Polymarket APIs</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-400">✓</span>
                            <span className="font-semibold">Market Data</span>
                        </div>
                        <p className="text-xs text-white/50">{markets.length} active markets loaded</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-yellow-400">⚠</span>
                            <span className="font-semibold">Wallet</span>
                        </div>
                        <p className="text-xs text-white/50">Demo mode - no wallet connected</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-yellow-400">⚠</span>
                            <span className="font-semibold">Approvals</span>
                        </div>
                        <p className="text-xs text-white/50">Would need CTF approvals for execution</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
