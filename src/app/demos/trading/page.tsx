'use client';

import { useState, useEffect } from 'react';
import { PageHeader, StatCard } from '@/components/common';

interface Market {
    conditionId: string;
    question: string;
    tokens: Array<{ tokenId: string; outcome: string; price: number }>;
}

export default function TradingPage() {
    const [market, setMarket] = useState<Market | null>(null);
    const [orderType, setOrderType] = useState<'GTC' | 'GTD' | 'FOK' | 'FAK'>('GTC');
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [outcome, setOutcome] = useState<'Yes' | 'No'>('Yes');
    const [price, setPrice] = useState('0.50');
    const [size, setSize] = useState('10');
    const [orderHistory, setOrderHistory] = useState<{ id: number; side: string; price: string; size: string; type: string; status: string }[]>([]);

    useEffect(() => {
        async function fetchMarket() {
            try {
                const res = await fetch('/api/markets?limit=1');
                const data = await res.json();
                if (data.markets?.[0]) {
                    const marketRes = await fetch(`/api/markets?id=${data.markets[0].conditionId}`);
                    const marketData = await marketRes.json();
                    setMarket(marketData.market);
                }
            } catch (err) {
                console.error('Error fetching market:', err);
            }
        }
        fetchMarket();
    }, []);

    function submitOrder() {
        // Simulated order submission
        const newOrder = {
            id: Date.now(),
            side,
            price,
            size,
            type: orderType,
            status: 'SIMULATED',
        };
        setOrderHistory([newOrder, ...orderHistory.slice(0, 9)]);
    }

    const orderTypeDescriptions: Record<string, string> = {
        GTC: 'Good Till Cancelled - Order remains open until filled or cancelled',
        GTD: 'Good Till Date - Order expires at a specific timestamp',
        FOK: 'Fill Or Kill - Must fill entirely or cancel immediately',
        FAK: 'Fill And Kill - Partial fills OK, cancel unfilled portion',
    };

    return (
        <div>
            <PageHeader
                title="Trading Orders"
                subtitle="Order form UI for limit and market orders (Demo Mode)"
                badge="Example 08"
            />

            <div className="mb-4">
                <div className="glass-card border-yellow-500/30 p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <div>
                            <h3 className="font-semibold text-yellow-400">Demo Mode</h3>
                            <p className="text-sm text-white/60">
                                This is a read-only demo. No actual trades will be executed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Form */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Order Form</h3>

                    {market && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg">
                            <p className="text-sm text-white/60">Market:</p>
                            <p className="font-medium line-clamp-2">{market.question}</p>
                        </div>
                    )}

                    {/* Outcome Selection */}
                    <div className="mb-4">
                        <label className="text-sm text-white/60 block mb-2">Outcome</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOutcome('Yes')}
                                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${outcome === 'Yes' ? 'bg-green-500' : 'bg-white/10'
                                    }`}
                            >
                                YES
                            </button>
                            <button
                                onClick={() => setOutcome('No')}
                                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${outcome === 'No' ? 'bg-red-500' : 'bg-white/10'
                                    }`}
                            >
                                NO
                            </button>
                        </div>
                    </div>

                    {/* Side Selection */}
                    <div className="mb-4">
                        <label className="text-sm text-white/60 block mb-2">Side</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSide('BUY')}
                                className={`flex-1 py-2 rounded-lg transition-colors ${side === 'BUY' ? 'bg-green-500/20 border border-green-500' : 'bg-white/10'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setSide('SELL')}
                                className={`flex-1 py-2 rounded-lg transition-colors ${side === 'SELL' ? 'bg-red-500/20 border border-red-500' : 'bg-white/10'
                                    }`}
                            >
                                SELL
                            </button>
                        </div>
                    </div>

                    {/* Order Type */}
                    <div className="mb-4">
                        <label className="text-sm text-white/60 block mb-2">Order Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['GTC', 'GTD', 'FOK', 'FAK'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`py-2 rounded-lg text-sm transition-colors ${orderType === type ? 'bg-blue-500' : 'bg-white/10'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-white/50 mt-2">{orderTypeDescriptions[orderType]}</p>
                    </div>

                    {/* Price & Size */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-white/60 block mb-2">Price</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                step="0.01"
                                min="0.01"
                                max="0.99"
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-right font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-white/60 block mb-2">Size (shares)</label>
                            <input
                                type="number"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                step="1"
                                min="1"
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-right font-mono"
                            />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="mb-4 p-3 bg-white/5 rounded-lg text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="text-white/60">Total Cost</span>
                            <span className="font-mono">${(parseFloat(price) * parseFloat(size)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/60">Max Profit</span>
                            <span className="font-mono text-green-400">
                                ${((1 - parseFloat(price)) * parseFloat(size)).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <button onClick={submitOrder} className="btn-primary w-full">
                        {side === 'BUY' ? '🟢' : '🔴'} Place {side} Order (Demo)
                    </button>
                </div>

                {/* Order History */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Order History (Simulated)</h3>

                    {orderHistory.length === 0 ? (
                        <p className="text-white/50 text-center py-8">No orders placed yet</p>
                    ) : (
                        <div className="space-y-2">
                            {orderHistory.map((order) => (
                                <div key={order.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`badge ${order.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                                            {order.side}
                                        </span>
                                        <span className="badge badge-blue">{order.type}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono">{order.size} @ {order.price}</div>
                                        <div className="text-xs text-yellow-400">{order.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
