'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface Market {
    question: string;
    slug: string;
    conditionId: string;
    tokens: Array<{
        outcome: string;
        price: number;
    }>;
}

export default function MarketDetailsPage() {
    const [slug, setSlug] = useState('khamenei-out-as-supreme-leader-of-iran-by-january-31');
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(false);

    async function loadMarket() {
        if (!slug) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/markets?slug=${slug}`);
            const data = await res.json();
            setMarket(data.market);
        } catch (error) {
            console.error('Failed to load market:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (slug) loadMarket();
    }, []);

    return (
        <div>
            <PageHeader
                title="Market Details"
                subtitle="Detailed view of a specific market"
                badge="Market"
            />

            {/* Slug Input */}
            <div className="glass-card mb-6">
                <label className="block text-sm text-white/60 mb-2">Market Slug</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-2 font-mono text-sm"
                        placeholder="market-slug"
                    />
                    <button onClick={loadMarket} className="btn-primary">
                        Load Market
                    </button>
                </div>
            </div>

            {/* Market Details */}
            {loading ? (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading market...</p>
                </div>
            ) : market && (
                <>
                    {/* Question */}
                    <div className="glass-card mb-6">
                        <h2 className="text-2xl font-bold mb-4">{market.question}</h2>
                        <div className="text-sm text-white/60">
                            <code className="bg-white/10 px-2 py-1 rounded">{market.conditionId}</code>
                        </div>
                    </div>

                    {/* Prices */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {market.tokens.map((token, idx) => (
                            <div key={idx} className="glass-card">
                                <div className="text-sm text-white/60 mb-2">{token.outcome}</div>
                                <div className="text-4xl font-bold mb-2">
                                    {(token.price * 100).toFixed(1)}¢
                                </div>
                                <div className="text-sm text-white/60">
                                    {token.price >= 0.5 ? 'Favored' : 'Underdog'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="glass-card">
                        <h3 className="text-lg font-semibold mb-4">Actions</h3>
                        <div className="flex gap-2">
                            <a
                                href={`https://polymarket.com/event/${market.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                            >
                                View on Polymarket
                            </a>
                            <a
                                href={`/demos/orderbook?conditionId=${market.conditionId}`}
                                className="btn-secondary"
                            >
                                View Orderbook
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
