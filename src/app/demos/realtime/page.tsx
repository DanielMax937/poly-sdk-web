'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common';

interface PriceUpdate {
    time: string;
    side: 'YES' | 'NO';
    price: number;
    spread: number;
}

export default function RealtimePage() {
    const [connected, setConnected] = useState(false);
    const [priceUpdates, setPriceUpdates] = useState<PriceUpdate[]>([]);
    const [yesPrice, setYesPrice] = useState(0.5);
    const [noPrice, setNoPrice] = useState(0.5);

    // Simulate WebSocket connection
    function startSimulation() {
        setConnected(true);
        setPriceUpdates([]);

        // Simulate price updates
        const interval = setInterval(() => {
            const side = Math.random() > 0.5 ? 'YES' : 'NO';
            const delta = (Math.random() - 0.5) * 0.02;

            if (side === 'YES') {
                setYesPrice((prev) => Math.max(0.01, Math.min(0.99, prev + delta)));
            } else {
                setNoPrice((prev) => Math.max(0.01, Math.min(0.99, prev + delta)));
            }

            setPriceUpdates((prev) => [
                {
                    time: new Date().toLocaleTimeString(),
                    side,
                    price: side === 'YES' ? yesPrice + delta : noPrice + delta,
                    spread: Math.abs(delta),
                },
                ...prev.slice(0, 19),
            ]);
        }, 1000);

        // Auto-disconnect after 30 seconds
        setTimeout(() => {
            clearInterval(interval);
            setConnected(false);
        }, 30000);
    }

    function stopSimulation() {
        setConnected(false);
    }

    return (
        <div>
            <PageHeader
                title="Realtime WebSocket"
                subtitle="Live price updates and orderbook changes (simulated demo)"
                badge="Example 07"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Connection Panel */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Connection</h3>

                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span>{connected ? 'Connected' : 'Disconnected'}</span>
                        </div>
                    </div>

                    <button
                        onClick={connected ? stopSimulation : startSimulation}
                        className={connected ? 'btn-secondary w-full' : 'btn-primary w-full'}
                    >
                        {connected ? 'Disconnect' : 'Start Simulation'}
                    </button>

                    <p className="text-xs text-white/50 mt-4">
                        Note: This is a simulated demo. In production, this would connect to
                        wss://ws-live-data.polymarket.com for real-time data.
                    </p>
                </div>

                {/* Live Prices */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Live Prices</h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 rounded-lg">
                            <div className="text-sm text-white/60 mb-1">YES</div>
                            <div className="text-3xl font-bold text-green-400">
                                {yesPrice.toFixed(4)}
                            </div>
                            <div className="text-sm text-white/50 mt-1">
                                {(yesPrice * 100).toFixed(1)}¢
                            </div>
                        </div>

                        <div className="p-4 bg-red-500/10 rounded-lg">
                            <div className="text-sm text-white/60 mb-1">NO</div>
                            <div className="text-3xl font-bold text-red-400">
                                {noPrice.toFixed(4)}
                            </div>
                            <div className="text-sm text-white/50 mt-1">
                                {(noPrice * 100).toFixed(1)}¢
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-lg">
                            <div className="text-sm text-white/60 mb-1">Sum</div>
                            <div className={`text-2xl font-bold ${yesPrice + noPrice < 0.99 ? 'text-green-400' :
                                    yesPrice + noPrice > 1.01 ? 'text-blue-400' : ''
                                }`}>
                                {(yesPrice + noPrice).toFixed(4)}
                            </div>
                            {yesPrice + noPrice < 0.99 && (
                                <div className="text-xs text-green-400 mt-1">Long ARB opportunity!</div>
                            )}
                            {yesPrice + noPrice > 1.01 && (
                                <div className="text-xs text-blue-400 mt-1">Short ARB opportunity!</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Price Feed */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Price Feed</h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {priceUpdates.length === 0 ? (
                            <p className="text-white/50 text-center py-8">
                                {connected ? 'Waiting for updates...' : 'Start simulation to see updates'}
                            </p>
                        ) : (
                            priceUpdates.map((update, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center p-2 bg-white/5 rounded text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-white/50">{update.time}</span>
                                        <span className={update.side === 'YES' ? 'text-green-400' : 'text-red-400'}>
                                            {update.side}
                                        </span>
                                    </div>
                                    <span className="font-mono">{update.price.toFixed(4)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Crypto Prices (simulated) */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-4 gradient-text">Crypto Prices (Demo)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/60">BTC/USDT</div>
                        <div className="text-xl font-bold text-yellow-400">$97,245.00</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/60">ETH/USDT</div>
                        <div className="text-xl font-bold text-blue-400">$3,412.50</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/60">MATIC/USDT</div>
                        <div className="text-xl font-bold text-purple-400">$0.52</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <div className="text-sm text-white/60">SOL/USDT</div>
                        <div className="text-xl font-bold text-green-400">$195.80</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
