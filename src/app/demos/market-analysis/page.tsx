'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage, StatCard } from '@/components/common';

interface GammaMarket {
    id: string;
    conditionId: string;
    slug: string;
    question: string;
    volume24hr?: number;
}

interface ArbitrageResult {
    type: 'long' | 'short';
    profit: number;
    action: string;
}

interface MarketAnalysis {
    market: GammaMarket;
    orderbook: {
        summary: {
            askSum: number;
            bidSum: number;
            longArbProfit: number;
            shortArbProfit: number;
            totalBidDepth: number;
            totalAskDepth: number;
            imbalanceRatio: number;
        };
    } | null;
    arbitrage: ArbitrageResult | null;
    error?: string;
}

export default function MarketAnalysisPage() {
    const [markets, setMarkets] = useState<GammaMarket[]>([]);
    const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
    const [scanning, setScanning] = useState(false);
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

    async function scanForArbitrage() {
        setScanning(true);
        setAnalyses([]);

        const results: MarketAnalysis[] = [];

        for (const market of markets) {
            try {
                // Fetch orderbook
                const obRes = await fetch(`/api/orderbook?conditionId=${market.conditionId}`);
                const obData = await obRes.json();

                // Fetch arbitrage
                const arbRes = await fetch(`/api/arbitrage?conditionId=${market.conditionId}&threshold=0.001`);
                const arbData = await arbRes.json();

                results.push({
                    market,
                    orderbook: obData.orderbook || null,
                    arbitrage: arbData.arbitrage || null,
                });
            } catch (err) {
                results.push({
                    market,
                    orderbook: null,
                    arbitrage: null,
                    error: (err as Error).message,
                });
            }

            // Update UI progressively
            setAnalyses([...results]);
        }

        setScanning(false);
    }

    const arbOpportunities = analyses.filter((a) => a.arbitrage);

    if (loading) return <LoadingSpinner text="Loading markets..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Market Analysis"
                subtitle="Scan markets for arbitrage opportunities and depth analysis"
                badge="Example 03"
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Markets to Scan" value={markets.length} />
                <StatCard label="Markets Analyzed" value={analyses.length} />
                <StatCard
                    label="Arbitrage Found"
                    value={arbOpportunities.length}
                    trend={arbOpportunities.length > 0 ? 'up' : 'neutral'}
                />
                <div className="glass-card flex items-center justify-center">
                    <button
                        onClick={scanForArbitrage}
                        disabled={scanning}
                        className="btn-primary disabled:opacity-50"
                    >
                        {scanning ? 'Scanning...' : '🔍 Scan Markets'}
                    </button>
                </div>
            </div>

            {/* Arbitrage Opportunities */}
            {arbOpportunities.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-green-400">
                        🎯 Arbitrage Opportunities ({arbOpportunities.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {arbOpportunities.map((analysis) => (
                            <div key={analysis.market.id} className="glass-card border-green-500/30">
                                <h3 className="font-semibold mb-2 line-clamp-2">{analysis.market.question}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="badge badge-green">
                                        {analysis.arbitrage?.type.toUpperCase()} ARB
                                    </span>
                                    <span className="text-green-400 font-bold">
                                        +{((analysis.arbitrage?.profit || 0) * 100).toFixed(3)}%
                                    </span>
                                </div>
                                <p className="text-sm text-white/60 mt-2">{analysis.arbitrage?.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Market Analysis Results */}
            {analyses.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Market Depth Analysis</h2>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Market</th>
                                    <th>Ask Sum</th>
                                    <th>Bid Sum</th>
                                    <th>Bid Depth</th>
                                    <th>Ask Depth</th>
                                    <th>Imbalance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyses.map((analysis) => (
                                    <tr key={analysis.market.id}>
                                        <td className="max-w-xs">
                                            <span className="line-clamp-1">{analysis.market.question}</span>
                                        </td>
                                        <td className="font-mono">
                                            {analysis.orderbook?.summary.askSum.toFixed(4) || '-'}
                                        </td>
                                        <td className="font-mono">
                                            {analysis.orderbook?.summary.bidSum.toFixed(4) || '-'}
                                        </td>
                                        <td className="font-mono">
                                            ${(analysis.orderbook?.summary.totalBidDepth || 0).toFixed(0)}
                                        </td>
                                        <td className="font-mono">
                                            ${(analysis.orderbook?.summary.totalAskDepth || 0).toFixed(0)}
                                        </td>
                                        <td>
                                            <span className={
                                                (analysis.orderbook?.summary.imbalanceRatio || 1) > 1.5 ? 'text-green-400' :
                                                    (analysis.orderbook?.summary.imbalanceRatio || 1) < 0.67 ? 'text-red-400' : ''
                                            }>
                                                {analysis.orderbook?.summary.imbalanceRatio.toFixed(2) || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            {analysis.error ? (
                                                <span className="badge badge-red">Error</span>
                                            ) : analysis.arbitrage ? (
                                                <span className="badge badge-green">ARB</span>
                                            ) : (
                                                <span className="badge badge-blue">OK</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {analyses.length === 0 && !scanning && (
                <div className="glass-card text-center py-12">
                    <p className="text-white/50 mb-4">Click "Scan Markets" to analyze trending markets for arbitrage</p>
                </div>
            )}
        </div>
    );
}
