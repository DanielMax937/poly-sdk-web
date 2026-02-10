'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage } from '@/components/common';

interface InsiderDetection {
    isInsider: boolean;
    signals: string[];
    confidence: 'low' | 'medium' | 'high';
    details: {
        largeBidOrder: boolean;
        largeAskOrder: boolean;
        orderImbalance: boolean;
        thinOrderBook: boolean;
        aggressiveBidding: boolean;
        largestBidSize?: number;
        largestAskSize?: number;
        imbalanceRatio?: number;
        bidDepth?: number;
        askDepth?: number;
    };
}

interface Market {
    id: string;
    conditionId: string;
    question: string;
    slug: string;
    volume: number;
    volume24hr: number;
    liquidity: number;
    endDate: string;
    outcomePrices: string[];
    clobTokenIds?: string[];
    active: boolean;
    insiderDetection?: InsiderDetection;
}

interface OrderbookSnapshot {
    conditionId: string;
    timestamp: number;
    bidDepth: number;
    askDepth: number;
    largestBid: number;
    largestAsk: number;
    imbalanceRatio: number;
}

// Futures trading keywords
const KEYWORDS = [
    'gold', 'silver', 'oil', 'bitcoin', 'ethereum',
    'natural gas', 'copper', 'corn', 'wheat', 'soybean'
];

export default function FuturesTraderPage() {
    const [selectedKeyword, setSelectedKeyword] = useState('gold');
    const [customKeyword, setCustomKeyword] = useState('');
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insiderCount, setInsiderCount] = useState(0);
    const [snapshots, setSnapshots] = useState<Map<string, OrderbookSnapshot[]>>(new Map());
    const [monitoring, setMonitoring] = useState<Set<string>>(new Set());

    // Search markets by keyword
    const searchMarkets = useCallback(async (keyword: string) => {
        if (!keyword.trim()) return;
        setSearching(true);
        setError(null);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}&limit=15&checkInsider=true&insiderTimeout=8000`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const marketResults = data.markets || [];
            setMarkets(marketResults);
            setInsiderCount(data.counts?.insiderDetected || 0);

            // Initialize snapshots for new markets
            setSnapshots(prev => {
                const newSnapshots = new Map(prev);
                marketResults.forEach((m: Market) => {
                    if (m.insiderDetection?.details && !newSnapshots.has(m.conditionId)) {
                        newSnapshots.set(m.conditionId, []);
                    }
                });
                return newSnapshots;
            });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSearching(false);
        }
    }, []);

    // Monitor market for sudden movements
    const startMonitoring = useCallback(async (market: Market) => {
        if (!market.conditionId) return;

        setMonitoring(prev => new Set(prev).add(market.conditionId));

        // Take initial snapshot
        const takeSnapshot = async () => {
            try {
                const res = await fetch(`/api/orderbook?conditionId=${market.conditionId}`);
                const data = await res.json();

                if (data.orderbook) {
                    const { summary } = data.orderbook;
                    const snapshot: OrderbookSnapshot = {
                        conditionId: market.conditionId,
                        timestamp: Date.now(),
                        bidDepth: summary.totalBidDepth || 0,
                        askDepth: summary.totalAskDepth || 0,
                        largestBid: Math.max(
                            data.orderbook.yes?.bidSize || 0,
                            data.orderbook.no?.bidSize || 0
                        ),
                        largestAsk: Math.max(
                            data.orderbook.yes?.askSize || 0,
                            data.orderbook.no?.askSize || 0
                        ),
                        imbalanceRatio: summary.imbalanceRatio || 1,
                    };

                    setSnapshots(prev => {
                        const newSnapshots = new Map(prev);
                        const existing = newSnapshots.get(market.conditionId) || [];
                        newSnapshots.set(market.conditionId, [...existing, snapshot].slice(-10)); // Keep last 10
                        return newSnapshots;
                    });
                }
            } catch (err) {
                console.error('Snapshot error:', err);
            }
        };

        // Take initial snapshot
        await takeSnapshot();

        // Poll every 10 seconds
        const interval = setInterval(takeSnapshot, 10000);

        // Store interval ID for cleanup
        (window as any).__monitoringIntervals = (window as any).__monitoringIntervals || {};
        (window as any).__monitoringIntervals[market.conditionId] = interval;
    }, []);

    const stopMonitoring = useCallback((conditionId: string) => {
        setMonitoring(prev => {
            const newSet = new Set(prev);
            newSet.delete(conditionId);
            return newSet;
        });

        const intervals = (window as any).__monitoringIntervals || {};
        if (intervals[conditionId]) {
            clearInterval(intervals[conditionId]);
            delete intervals[conditionId];
        }
    }, []);

    // Detect sudden movement from snapshots
    const detectSuddenMovement = useCallback((conditionId: string): { hasMovement: boolean; change: string } => {
        const marketSnapshots = snapshots.get(conditionId) || [];
        if (marketSnapshots.length < 2) return { hasMovement: false, change: 'Not enough data' };

        const latest = marketSnapshots[marketSnapshots.length - 1];
        const previous = marketSnapshots[marketSnapshots.length - 2];

        // Calculate changes
        const bidDepthChange = ((latest.bidDepth - previous.bidDepth) / (previous.bidDepth || 1)) * 100;
        const askDepthChange = ((latest.askDepth - previous.askDepth) / (previous.askDepth || 1)) * 100;
        const bidSizeChange = ((latest.largestBid - previous.largestBid) / (previous.largestBid || 1)) * 100;
        const imbalanceChange = Math.abs(latest.imbalanceRatio - previous.imbalanceRatio);

        // Sudden movement thresholds
        const hasMovement =
            Math.abs(bidDepthChange) > 50 ||    // 50%+ change in bid depth
            Math.abs(askDepthChange) > 50 ||    // 50%+ change in ask depth
            bidSizeChange > 100 ||               // 100%+ increase in largest bid
            imbalanceChange > 1;                 // Imbalance ratio changed by >1

        const changes: string[] = [];
        if (Math.abs(bidDepthChange) > 50) changes.push(`Bid depth ${bidDepthChange.toFixed(0)}%`);
        if (Math.abs(askDepthChange) > 50) changes.push(`Ask depth ${askDepthChange.toFixed(0)}%`);
        if (bidSizeChange > 100) changes.push(`Large bid +${bidSizeChange.toFixed(0)}%`);
        if (imbalanceChange > 1) changes.push(`Imbalance Δ${imbalanceChange.toFixed(1)}`);

        return {
            hasMovement,
            change: changes.join(', ') || 'No significant change'
        };
    }, [snapshots]);

    // Initial search on mount
    useEffect(() => {
        searchMarkets(selectedKeyword);
    }, [selectedKeyword, searchMarkets]);

    // Cleanup intervals on unmount
    useEffect(() => {
        return () => {
            const intervals = (window as any).__monitoringIntervals || {};
            Object.values(intervals).forEach((interval: any) => clearInterval(interval));
        };
    }, []);

    const handleSearch = () => {
        const keyword = customKeyword.trim() || selectedKeyword;
        searchMarkets(keyword);
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-yellow-400';
            default: return 'text-green-400';
        }
    };

    const getConfidenceBg = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'bg-red-500/20 border-red-500/30';
            case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
            default: return 'bg-green-500/20 border-green-500/30';
        }
    };

    return (
        <div>
            <PageHeader
                title="Futures Trader Scanner"
                subtitle="Search commodity keywords and detect sudden market movements / insider activity"
                badge="Trader Tools"
            />

            {/* Search Controls */}
            <div className="glass-card mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-white/60 mb-2">Quick Keywords</label>
                        <div className="flex flex-wrap gap-2">
                            {KEYWORDS.map(keyword => (
                                <button
                                    key={keyword}
                                    onClick={() => {
                                        setSelectedKeyword(keyword);
                                        setCustomKeyword('');
                                    }}
                                    className={`px-3 py-1.5 rounded text-sm transition ${
                                        selectedKeyword === keyword && !customKeyword
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/10 hover:bg-white/20'
                                    }`}
                                >
                                    {keyword}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-white/60 mb-2">Custom Keyword</label>
                        <input
                            type="text"
                            value={customKeyword}
                            onChange={(e) => setCustomKeyword(e.target.value)}
                            placeholder="e.g., S&P 500, inflation..."
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded font-semibold transition"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            {markets.length > 0 && !searching && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass-card">
                        <div className="text-sm text-white/50">Markets Found</div>
                        <div className="text-2xl font-bold">{markets.length}</div>
                    </div>
                    <div className="glass-card">
                        <div className="text-sm text-white/50">Insider Signals</div>
                        <div className="text-2xl font-bold text-red-400">{insiderCount}</div>
                    </div>
                    <div className="glass-card">
                        <div className="text-sm text-white/50">Monitoring</div>
                        <div className="text-2xl font-bold text-blue-400">{monitoring.size}</div>
                    </div>
                    <div className="glass-card">
                        <div className="text-sm text-white/50">Total Volume (24h)</div>
                        <div className="text-2xl font-bold">
                            ${(markets.reduce((sum, m) => sum + (m.volume24hr || 0), 0) / 1000).toFixed(0)}K
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && <ErrorMessage message={error} />}

            {/* Loading */}
            {searching && <LoadingSpinner text="Searching markets and analyzing orderbooks..." />}

            {/* Results */}
            {!searching && markets.length === 0 && !error && (
                <div className="glass-card text-center py-12">
                    <p className="text-white/50">Enter a keyword to search for related markets</p>
                </div>
            )}

            {/* Markets List */}
            {!searching && markets.length > 0 && (
                <div className="space-y-4">
                    {markets.map((market) => {
                        const movement = detectSuddenMovement(market.conditionId);
                        const isMonitoring = monitoring.has(market.conditionId);
                        const isInsider = market.insiderDetection?.isInsider;
                        const confidence = market.insiderDetection?.confidence || 'low';

                        return (
                            <div
                                key={market.id}
                                className={`glass-card border transition ${
                                    isInsider ? 'border-red-500/50' : 'border-white/10'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white mb-1">{market.question}</h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-white/50">
                                            <span>Volume: ${(market.volume24hr / 1000).toFixed(1)}K</span>
                                            <span>Liquidity: ${(market.liquidity / 1000).toFixed(1)}K</span>
                                            {market.outcomePrices && (
                                                <span>Prices: YES ${(parseFloat(market.outcomePrices[0]) * 100).toFixed(0)}¢ | NO ${(parseFloat(market.outcomePrices[1]) * 100).toFixed(0)}¢</span>
                                            )}
                                            {market.endDate && (
                                                <span>Ends: {new Date(market.endDate).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Monitor Button */}
                                        <button
                                            onClick={() => isMonitoring ? stopMonitoring(market.conditionId) : startMonitoring(market)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                isMonitoring
                                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            }`}
                                        >
                                            {isMonitoring ? 'Monitoring...' : 'Monitor'}
                                        </button>

                                        {/* Insider Badge */}
                                        {isInsider && (
                                            <span className={`px-3 py-1 text-sm rounded ${getConfidenceBg(confidence)} border ${getConfidenceColor(confidence)}`}>
                                                INSIDER {confidence.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Insider Signals */}
                                {isInsider && market.insiderDetection?.signals && (
                                    <div className={`mb-3 p-3 rounded ${getConfidenceBg(confidence)} border`}>
                                        <div className="text-sm font-semibold mb-2">⚠️ Insider Detection Signals:</div>
                                        <ul className="text-sm space-y-1">
                                            {market.insiderDetection.signals.map((signal, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <span className="text-red-400">→</span>
                                                    <span>{signal}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Sudden Movement Detection */}
                                {isMonitoring && (
                                    <div className={`p-3 rounded ${movement.hasMovement ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/5'} border border-white/10`}>
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm">
                                                <span className="font-semibold">Movement Detection:</span>
                                                <span className={`ml-2 ${movement.hasMovement ? 'text-orange-400' : 'text-white/50'}`}>
                                                    {movement.change}
                                                </span>
                                            </div>
                                            {movement.hasMovement && (
                                                <span className="text-orange-400 text-xs animate-pulse">● LIVE ALERT</span>
                                            )}
                                        </div>
                                        {movement.hasMovement && (
                                            <div className="mt-2 text-xs text-white/60">
                                                Detected significant orderbook change in last snapshot. Consider investigating further.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Orderbook Details */}
                                {market.insiderDetection?.details && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                                        <div className="bg-white/5 p-2 rounded">
                                            <div className="text-white/50 text-xs">Bid Depth</div>
                                            <div className="font-mono">${(market.insiderDetection.details.bidDepth || 0).toFixed(0)}</div>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded">
                                            <div className="text-white/50 text-xs">Ask Depth</div>
                                            <div className="font-mono">${(market.insiderDetection.details.askDepth || 0).toFixed(0)}</div>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded">
                                            <div className="text-white/50 text-xs">Imbalance</div>
                                            <div className="font-mono">{(market.insiderDetection.details.imbalanceRatio || 1).toFixed(2)}x</div>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded">
                                            <div className="text-white/50 text-xs">Largest Bid</div>
                                            <div className="font-mono">${(market.insiderDetection.details.largestBidSize || 0).toFixed(0)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
