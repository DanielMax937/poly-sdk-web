'use client';

import { useEffect, useState } from 'react';
import { MarketCard } from '@/components/MarketCard';
import { OrderbookDisplay } from '@/components/OrderbookDisplay';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/common';

interface GammaMarket {
    id: string;
    conditionId: string;
    slug: string;
    question: string;
    volume: number;
    volume24hr?: number;
    outcomePrices: number[];
}

interface UnifiedMarket {
    conditionId: string;
    question: string;
    tokens: Array<{
        tokenId: string;
        outcome: string;
        price: number;
    }>;
    source: string;
}

interface Orderbook {
    yes: { bid: number; ask: number; bidSize: number; askSize: number; spread: number };
    no: { bid: number; ask: number; bidSize: number; askSize: number; spread: number };
    summary: {
        askSum: number;
        bidSum: number;
        longArbProfit: number;
        shortArbProfit: number;
        totalBidDepth: number;
        totalAskDepth: number;
        imbalanceRatio: number;
    };
}

export default function BasicUsagePage() {
    const [markets, setMarkets] = useState<GammaMarket[]>([]);
    const [selectedMarket, setSelectedMarket] = useState<UnifiedMarket | null>(null);
    const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMarkets() {
            try {
                const res = await fetch('/api/markets?limit=6');
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

    async function selectMarket(market: GammaMarket) {
        try {
            // Fetch unified market details
            const marketRes = await fetch(`/api/markets?id=${market.conditionId}`);
            const marketData = await marketRes.json();
            setSelectedMarket(marketData.market);

            // Fetch orderbook
            const obRes = await fetch(`/api/orderbook?conditionId=${market.conditionId}`);
            const obData = await obRes.json();
            setOrderbook(obData.orderbook);
        } catch (err) {
            console.error('Error fetching market details:', err);
        }
    }

    if (loading) return <LoadingSpinner text="Fetching trending markets..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Basic Usage"
                subtitle="Trending markets from Gamma API, unified market details, and orderbook data"
                badge="Example 01"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Markets List */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Trending Markets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {markets.map((market) => (
                            <MarketCard
                                key={market.id}
                                question={market.question}
                                slug={market.slug}
                                volume={market.volume}
                                volume24hr={market.volume24hr}
                                yesPrice={market.outcomePrices[0]}
                                noPrice={market.outcomePrices[1]}
                                conditionId={market.conditionId}
                                onClick={() => selectMarket(market)}
                                selected={selectedMarket?.conditionId === market.conditionId}
                            />
                        ))}
                    </div>
                </div>

                {/* Selected Market Details */}
                <div className="space-y-4">
                    {selectedMarket && (
                        <div className="glass-card">
                            <h3 className="text-lg font-semibold mb-3 gradient-text">Market Details</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-white/50">Question:</span>
                                    <p className="font-medium">{selectedMarket.question}</p>
                                </div>
                                <div>
                                    <span className="text-white/50">Condition ID:</span>
                                    <p className="font-mono text-xs break-all">{selectedMarket.conditionId}</p>
                                </div>
                                <div>
                                    <span className="text-white/50">Source:</span>
                                    <span className="ml-2">{selectedMarket.source}</span>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <span className="text-white/50">Tokens:</span>
                                    {selectedMarket.tokens.map((token) => (
                                        <div key={token.tokenId} className="ml-2 mt-1">
                                            <span className={token.outcome === 'Yes' ? 'text-green-400' : 'text-red-400'}>
                                                {token.outcome}:
                                            </span>
                                            <span className="ml-2 font-mono">{token.price.toFixed(4)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {orderbook && <OrderbookDisplay {...orderbook} />}

                    {!selectedMarket && (
                        <div className="glass-card text-center py-8">
                            <p className="text-white/50">Select a market to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
