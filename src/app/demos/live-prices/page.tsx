'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface Market {
    question: string;
    tokens: Array<{
        outcome: string;
        price: number;
    }>;
}

export default function LivePricesPage() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);

    useEffect(() => {
        loadPrices();

        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(loadPrices, 5000); // Refresh every 5 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    async function loadPrices() {
        try {
            const res = await fetch('/api/markets?limit=10');
            const data = await res.json();
            setMarkets(data.markets || []);
        } catch (error) {
            console.error('Failed to load prices:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Live Prices"
                subtitle="Real-time market prices from Polymarket"
                badge="Live"
            />

            {/* Controls */}
            <div className="glass-card mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Auto-refresh (5s)</span>
                        </label>
                        {autoRefresh && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Live
                            </span>
                        )}
                    </div>
                    <button onClick={loadPrices} className="btn-secondary text-sm">
                        🔄 Refresh Now
                    </button>
                </div>
            </div>

            {/* Prices Grid */}
            {loading ? (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading prices...</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {markets.map((market, idx) => (
                        <div key={idx} className="glass-card hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{market.question}</div>
                                </div>
                                <div className="flex gap-3 flex-shrink-0">
                                    {market.tokens.map((token, tidx) => (
                                        <div key={tidx} className="text-center min-w-[80px]">
                                            <div className="text-xs text-white/60">{token.outcome}</div>
                                            <div className={`text-xl font-bold font-mono ${token.outcome === 'Yes' ? 'text-green-400' : 'text-red-400'}`}>
                                                {(token.price * 100).toFixed(1)}¢
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-2">ℹ️ Live Updates</h3>
                <p className="text-sm text-white/70">
                    Enable auto-refresh to see prices update in real-time. Prices are fetched from Polymarket's Gamma API.
                </p>
            </div>
        </div>
    );
}
