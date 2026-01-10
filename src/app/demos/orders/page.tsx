'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common';

interface OpenOrder {
    id: string;
    market: string;
    asset_id: string;
    side: 'BUY' | 'SELL';
    price: string;
    original_size: string;
    size_matched: string;
    outcome: string;
    type: string;
    created_at: number;
}

export default function OrdersPage() {
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [orders, setOrders] = useState<OpenOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [tokenId, setTokenId] = useState('');
    const [price, setPrice] = useState('');
    const [size, setSize] = useState('');
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState('GTC');
    const [submitting, setSubmitting] = useState(false);
    const [orderResult, setOrderResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        checkConfiguration();
    }, []);

    async function checkConfiguration() {
        try {
            const res = await fetch('/api/orders');
            if (res.status === 503) {
                const data = await res.json();
                setConfigured(data.configured === true);
            } else {
                setConfigured(true);
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch {
            setConfigured(false);
        }
    }

    async function loadOrders() {
        if (!configured) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/orders');
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to load orders');
            }
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitOrder(e: React.FormEvent) {
        e.preventDefault();
        if (!configured) return;

        setSubmitting(true);
        setOrderResult(null);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenId,
                    price: parseFloat(price),
                    size: parseFloat(size),
                    side,
                    orderType,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setOrderResult({ success: false, message: data.error || 'Order failed' });
            } else {
                setOrderResult({ success: true, message: `Order created: ${data.orderId}` });
                loadOrders();
            }
        } catch (err) {
            setOrderResult({ success: false, message: (err as Error).message });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCancelOrder(orderId: string) {
        if (!confirm('Cancel this order?')) return;
        try {
            const res = await fetch(`/api/orders?orderId=${orderId}`, { method: 'DELETE' });
            if (res.ok) {
                loadOrders();
            }
        } catch (err) {
            console.error('Cancel error:', err);
        }
    }

    return (
        <div>
            <PageHeader
                title="Order Management"
                subtitle="Create and manage orders on Polymarket CLOB"
                badge="Trading"
            />

            {/* Configuration Status */}
            <div className={`glass-card mb-6 ${configured === false ? 'border-yellow-500/50' : ''}`}>
                <h3 className="text-lg font-semibold mb-2">Configuration Status</h3>
                {configured === null ? (
                    <p className="text-white/60">Checking...</p>
                ) : configured ? (
                    <p className="text-green-400">✅ Order credentials configured</p>
                ) : (
                    <div>
                        <p className="text-yellow-400 mb-2">⚠️ Order credentials not configured</p>
                        <p className="text-sm text-white/60">
                            Add the following to your <code className="bg-white/10 px-1 rounded">.env.local</code>:
                        </p>
                        <pre className="text-xs bg-black/30 p-3 rounded mt-2 overflow-auto">
                            {`POLY_PRIVATE_KEY=your_private_key
POLY_API_KEY=your_api_key
POLY_API_SECRET=your_api_secret
POLY_API_PASSPHRASE=your_passphrase`}
                        </pre>
                    </div>
                )}
            </div>

            {configured && (
                <>
                    {/* Order Form */}
                    <div className="glass-card mb-6">
                        <h3 className="text-lg font-semibold mb-4">Create Order</h3>
                        <form onSubmit={handleSubmitOrder} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Token ID</label>
                                    <input
                                        type="text"
                                        value={tokenId}
                                        onChange={(e) => setTokenId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                        placeholder="Token ID from market"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="side-select" className="block text-sm text-white/60 mb-1">Side</label>
                                    <select
                                        id="side-select"
                                        title="Select order side"
                                        value={side}
                                        onChange={(e) => setSide(e.target.value as 'BUY' | 'SELL')}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                    >
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max="0.99"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                        placeholder="0.50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">Size (shares)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={size}
                                        onChange={(e) => setSize(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                        placeholder="10"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="order-type-select" className="block text-sm text-white/60 mb-1">Order Type</label>
                                    <select
                                        id="order-type-select"
                                        title="Select order type"
                                        value={orderType}
                                        onChange={(e) => setOrderType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
                                    >
                                        <option value="GTC">GTC (Good Til Cancelled)</option>
                                        <option value="GTD">GTD (Good Til Date)</option>
                                        <option value="FOK">FOK (Fill or Kill)</option>
                                        <option value="FAK">FAK (Fill and Kill)</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn-primary disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Place Order'}
                            </button>
                        </form>
                        {orderResult && (
                            <div className={`mt-4 p-3 rounded ${orderResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {orderResult.message}
                            </div>
                        )}
                    </div>

                    {/* Open Orders */}
                    <div className="glass-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Open Orders</h3>
                            <button onClick={loadOrders} disabled={loading} className="btn-secondary text-sm">
                                {loading ? 'Loading...' : '🔄 Refresh'}
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {orders.length === 0 ? (
                            <p className="text-white/60">No open orders</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-white/60 border-b border-white/10">
                                        <tr>
                                            <th className="text-left py-2 px-2">Side</th>
                                            <th className="text-left py-2 px-2">Price</th>
                                            <th className="text-left py-2 px-2">Size</th>
                                            <th className="text-left py-2 px-2">Filled</th>
                                            <th className="text-left py-2 px-2">Type</th>
                                            <th className="text-left py-2 px-2">Created</th>
                                            <th className="text-right py-2 px-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => (
                                            <tr key={order.id} className="border-b border-white/5">
                                                <td className={`py-2 px-2 font-bold ${order.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {order.side}
                                                </td>
                                                <td className="py-2 px-2">${order.price}</td>
                                                <td className="py-2 px-2">{order.original_size}</td>
                                                <td className="py-2 px-2">{order.size_matched}</td>
                                                <td className="py-2 px-2">{order.type}</td>
                                                <td className="py-2 px-2 text-white/60">
                                                    {new Date(order.created_at * 1000).toLocaleString()}
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="text-red-400 hover:text-red-300 text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Info */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-2">ℹ️ Order Types</h3>
                <ul className="text-sm text-white/70 space-y-1">
                    <li><strong>GTC</strong> - Good Til Cancelled: Active until filled or cancelled</li>
                    <li><strong>GTD</strong> - Good Til Date: Active until specified expiration</li>
                    <li><strong>FOK</strong> - Fill or Kill: Must fill entirely or cancel</li>
                    <li><strong>FAK</strong> - Fill and Kill: Fill what&apos;s available, cancel rest</li>
                </ul>
            </div>
        </div>
    );
}
