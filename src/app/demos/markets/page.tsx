'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface Market {
    conditionId: string;
    question: string;
    slug: string;
    volume: number;
    tokens: Array<{
        tokenId: string;
        outcome: string;
        price: number;
    }>;
}

export default function MarketsPage() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        loadMarkets();
    }, [limit]);

    async function loadMarkets() {
        setLoading(true);
        try {
            const res = await fetch(`/api/markets?limit=${limit}`);
            const data = await res.json();
            setMarkets(data.markets || []);
        } catch (error) {
            console.error('Failed to load markets:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Trending Markets"
                subtitle="Browse popular prediction markets on Polymarket"
                badge="Markets"
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
                        <option value={5}>5 markets</option>
                        <option value={10}>10 markets</option>
                        <option value={20}>20 markets</option>
                        <option value={50}>50 markets</option>
                    </select>
                    <button onClick={loadMarkets} className="btn-secondary text-sm ml-auto">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Markets Grid */}
            {loading ? (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading markets...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {markets.map((market) => (
                        <div key={market.conditionId} className="glass-card hover:border-blue-500/50 transition-colors">
                            <h3 className="text-lg font-semibold mb-3">{market.question}</h3>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {market.tokens.map((token) => (
                                    <div key={token.tokenId} className="bg-white/5 rounded p-3">
                                        <div className="text-sm text-white/60 mb-1">{token.outcome}</div>
                                        <div className="text-2xl font-bold">
                                            {(token.price * 100).toFixed(1)}¢
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/60">
                                    Volume: ${(market.volume / 1000000).toFixed(2)}M
                                </span>
                                <a
                                    href={`https://polymarket.com/event/${market.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    View on Polymarket →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
