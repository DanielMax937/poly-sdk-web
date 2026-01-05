'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage, StatCard } from '@/components/common';

interface Trade {
    price: number;
    size: number;
    side: 'BUY' | 'SELL';
    timestamp: number;
    outcomeIndex: number;
    outcome: string;
}

interface KLineCandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    tradeCount: number;
}

interface GammaMarket {
    id: string;
    conditionId: string;
    question: string;
    volume24hr?: number;
}

function aggregateToKLines(trades: Trade[], intervalMs: number): KLineCandle[] {
    const buckets = new Map<number, Trade[]>();

    for (const trade of trades) {
        const bucketTime = Math.floor(trade.timestamp / intervalMs) * intervalMs;
        const bucket = buckets.get(bucketTime) || [];
        bucket.push(trade);
        buckets.set(bucketTime, bucket);
    }

    const candles: KLineCandle[] = [];
    for (const [timestamp, bucketTrades] of buckets) {
        if (bucketTrades.length === 0) continue;
        bucketTrades.sort((a, b) => a.timestamp - b.timestamp);

        const prices = bucketTrades.map((t) => t.price);
        candles.push({
            timestamp,
            open: bucketTrades[0].price,
            high: Math.max(...prices),
            low: Math.min(...prices),
            close: bucketTrades[bucketTrades.length - 1].price,
            volume: bucketTrades.reduce((sum, t) => sum + t.size * t.price, 0),
            tradeCount: bucketTrades.length,
        });
    }

    return candles.sort((a, b) => a.timestamp - b.timestamp);
}

export default function KLinePage() {
    const [market, setMarket] = useState<GammaMarket | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [yesCandles, setYesCandles] = useState<KLineCandle[]>([]);
    const [noCandles, setNoCandles] = useState<KLineCandle[]>([]);
    const [interval, setInterval] = useState<'5m' | '15m' | '1h' | '4h'>('1h');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const intervalMs: Record<string, number> = {
        '5m': 5 * 60 * 1000,
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '4h': 4 * 60 * 60 * 1000,
    };

    useEffect(() => {
        async function fetchData() {
            try {
                // Get trending market
                const marketRes = await fetch('/api/markets?limit=1');
                const marketData = await marketRes.json();
                const firstMarket = marketData.markets?.[0];
                if (!firstMarket) throw new Error('No markets found');
                setMarket(firstMarket);

                // Get trades
                const tradesRes = await fetch(`/api/trades?market=${firstMarket.conditionId}&limit=500`);
                const tradesData = await tradesRes.json();
                setTrades(tradesData.trades || []);
                setLoading(false);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (trades.length === 0) return;

        const yesTrades = trades.filter((t) => t.outcomeIndex === 0 || t.outcome === 'Yes');
        const noTrades = trades.filter((t) => t.outcomeIndex === 1 || t.outcome === 'No');

        setYesCandles(aggregateToKLines(yesTrades, intervalMs[interval]));
        setNoCandles(aggregateToKLines(noTrades, intervalMs[interval]));
    }, [trades, interval]);

    if (loading) return <LoadingSpinner text="Fetching trade data..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="K-Line Aggregation"
                subtitle="Trade data visualization with OHLCV charts"
                badge="Example 04"
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Trades" value={trades.length} />
                <StatCard label="YES Candles" value={yesCandles.length} />
                <StatCard label="NO Candles" value={noCandles.length} />
                <div className="glass-card">
                    <div className="text-sm text-white/50 mb-2">Interval</div>
                    <div className="flex gap-2">
                        {(['5m', '15m', '1h', '4h'] as const).map((i) => (
                            <button
                                key={i}
                                onClick={() => setInterval(i)}
                                className={`px-3 py-1 rounded text-sm ${interval === i ? 'bg-blue-500' : 'bg-white/10'
                                    }`}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {market && (
                <div className="glass-card mb-6">
                    <h3 className="font-semibold mb-2">{market.question}</h3>
                    <p className="text-sm text-white/50">
                        Condition ID: {market.conditionId.slice(0, 20)}...
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* YES Candles */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">YES Token K-Lines</h3>
                    <div className="overflow-x-auto">
                        <table className="data-table text-sm">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Open</th>
                                    <th>High</th>
                                    <th>Low</th>
                                    <th>Close</th>
                                    <th>Vol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yesCandles.slice(-10).map((candle) => (
                                    <tr key={candle.timestamp}>
                                        <td className="text-white/60">
                                            {new Date(candle.timestamp).toLocaleString()}
                                        </td>
                                        <td className="font-mono">{candle.open.toFixed(3)}</td>
                                        <td className="font-mono text-green-400">{candle.high.toFixed(3)}</td>
                                        <td className="font-mono text-red-400">{candle.low.toFixed(3)}</td>
                                        <td className="font-mono">{candle.close.toFixed(3)}</td>
                                        <td className="font-mono">${candle.volume.toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* NO Candles */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 text-red-400">NO Token K-Lines</h3>
                    <div className="overflow-x-auto">
                        <table className="data-table text-sm">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Open</th>
                                    <th>High</th>
                                    <th>Low</th>
                                    <th>Close</th>
                                    <th>Vol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {noCandles.slice(-10).map((candle) => (
                                    <tr key={candle.timestamp}>
                                        <td className="text-white/60">
                                            {new Date(candle.timestamp).toLocaleString()}
                                        </td>
                                        <td className="font-mono">{candle.open.toFixed(3)}</td>
                                        <td className="font-mono text-green-400">{candle.high.toFixed(3)}</td>
                                        <td className="font-mono text-red-400">{candle.low.toFixed(3)}</td>
                                        <td className="font-mono">{candle.close.toFixed(3)}</td>
                                        <td className="font-mono">${candle.volume.toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Spread Analysis */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-4 gradient-text">Spread Analysis</h3>
                <p className="text-sm text-white/60 mb-4">
                    YES + NO price sum over time. Values near 1.00 indicate efficient pricing.
                </p>
                <div className="overflow-x-auto">
                    <table className="data-table text-sm">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>YES Close</th>
                                <th>NO Close</th>
                                <th>Sum</th>
                                <th>Signal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yesCandles.slice(-10).map((yesCandle) => {
                                const noCandle = noCandles.find((n) => n.timestamp === yesCandle.timestamp);
                                const sum = yesCandle.close + (noCandle?.close || 0.5);
                                return (
                                    <tr key={yesCandle.timestamp}>
                                        <td className="text-white/60">
                                            {new Date(yesCandle.timestamp).toLocaleString()}
                                        </td>
                                        <td className="font-mono text-green-400">{yesCandle.close.toFixed(3)}</td>
                                        <td className="font-mono text-red-400">{noCandle?.close.toFixed(3) || '-'}</td>
                                        <td className="font-mono">{sum.toFixed(4)}</td>
                                        <td>
                                            {sum < 0.99 ? (
                                                <span className="badge badge-green">LONG ARB</span>
                                            ) : sum > 1.01 ? (
                                                <span className="badge badge-blue">SHORT ARB</span>
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
