'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface OrderbookSide {
    bid: number;
    ask: number;
    bidSize: number;
    askSize: number;
    spread: number;
}

interface Orderbook {
    yes: OrderbookSide;
    no: OrderbookSide;
}

export default function OrderbookPage() {
    const [yesTokenId, setYesTokenId] = useState('16615878769673384167929477377853480343169830037043821933967995321252596015328');
    const [noTokenId, setNoTokenId] = useState('44169729231600183934113609960222670358715639208411971924042241295619035924872');
    const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
    const [loading, setLoading] = useState(false);

    async function loadOrderbook() {
        if (!yesTokenId || !noTokenId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/orderbook?yesTokenId=${yesTokenId}&noTokenId=${noTokenId}`);
            const data = await res.json();
            setOrderbook(data.orderbook);
        } catch (error) {
            console.error('Failed to load orderbook:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Orderbook Viewer"
                subtitle="View live orderbook data for any market"
                badge="Orderbook"
            />

            {/* Token ID Inputs */}
            <div className="glass-card mb-6">
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Yes Token ID</label>
                        <input
                            type="text"
                            value={yesTokenId}
                            onChange={(e) => setYesTokenId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 font-mono text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-2">No Token ID</label>
                        <input
                            type="text"
                            value={noTokenId}
                            onChange={(e) => setNoTokenId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 font-mono text-sm"
                        />
                    </div>
                    <button onClick={loadOrderbook} className="btn-primary">
                        Load Orderbook
                    </button>
                </div>
            </div>

            {/* Orderbook Display */}
            {loading ? (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading orderbook...</p>
                </div>
            ) : orderbook && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Yes Orderbook */}
                    <div className="glass-card">
                        <h3 className="text-lg font-semibold mb-4 text-green-400">YES Orderbook</h3>
                        <div className="space-y-3">
                            <div className="bg-green-500/10  rounded p-4">
                                <div className="text-sm text-white/60 mb-1">Best Ask</div>
                                <div className="text-3xl font-bold">{(orderbook.yes.ask * 100).toFixed(1)}¢</div>
                                <div className="text-sm text-white/60 mt-1">Size: {orderbook.yes.askSize.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-500/10 rounded p-4">
                                <div className="text-sm text-white/60 mb-1">Best Bid</div>
                                <div className="text-3xl font-bold">{(orderbook.yes.bid * 100).toFixed(1)}¢</div>
                                <div className="text-sm text-white/60 mt-1">Size: {orderbook.yes.bidSize.toLocaleString()}</div>
                            </div>
                            <div className="bg-white/5 rounded p-3">
                                <div className="text-sm text-white/60">Spread</div>
                                <div className="text-xl font-mono">{(orderbook.yes.spread * 100).toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>

                    {/* No Orderbook */}
                    <div className="glass-card">
                        <h3 className="text-lg font-semibold mb-4 text-red-400">NO Orderbook</h3>
                        <div className="space-y-3">
                            <div className="bg-red-500/10 rounded p-4">
                                <div className="text-sm text-white/60 mb-1">Best Ask</div>
                                <div className="text-3xl font-bold">{(orderbook.no.ask * 100).toFixed(1)}¢</div>
                                <div className="text-sm text-white/60 mt-1">Size: {orderbook.no.askSize.toLocaleString()}</div>
                            </div>
                            <div className="bg-red-500/10 rounded p-4">
                                <div className="text-sm text-white/60 mb-1">Best Bid</div>
                                <div className="text-3xl font-bold">{(orderbook.no.bid * 100).toFixed(1)}¢</div>
                                <div className="text-sm text-white/60 mt-1">Size: {orderbook.no.bidSize.toLocaleString()}</div>
                            </div>
                            <div className="bg-white/5 rounded p-3">
                                <div className="text-sm text-white/60">Spread</div>
                                <div className="text-xl font-mono">{(orderbook.no.spread * 100).toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-2">ℹ️ How to Use</h3>
                <p className="text-sm text-white/70">
                    Enter the Yes and No token IDs from a market to view its live orderbook. Token IDs can be found through the Markets API or Events API.
                </p>
            </div>
        </div>
    );
}
