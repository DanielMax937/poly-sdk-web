'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common';

interface Position {
    conditionId: string;
    title: string;
    outcome: string;
    size: number;
    avgPrice: number;
    curPrice?: number;
    cashPnl?: number;
    percentPnl?: number;
}

interface Activity {
    timestamp: number;
    action: string;
    market: string;
    outcome: string;
    amount: number;
}

export default function WalletPage() {
    const [address, setAddress] = useState('');
    const [viewType, setViewType] = useState<'positions' | 'activity'>('positions');
    const [positions, setPositions] = useState<Position[]>([]);
    const [activity, setActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    async function loadWalletData() {
        if (!address) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/wallet?address=${address}&type=${viewType}`);
            const data = await res.json();

            if (viewType === 'positions') {
                setPositions(data.positions || []);
            } else {
                setActivity(data.activity || []);
            }
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Wallet Viewer"
                subtitle="View positions and activity for any Polymarket wallet"
                badge="Wallet"
            />

            {/* Address Input */}
            <div className="glass-card mb-6">
                <label className="block text-sm text-white/60 mb-2">Wallet Address</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="0x..."
                        className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-2"
                    />
                    <button onClick={loadWalletData} className="btn-primary">
                        Load Wallet
                    </button>
                </div>
            </div>

            {address && (
                <>
                    {/* View Type Selector */}
                    <div className="glass-card mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewType('positions')}
                                className={`px-4 py-2 rounded ${viewType === 'positions' ? 'bg-blue-500' : 'bg-white/5'}`}
                            >
                                Positions
                            </button>
                            <button
                                onClick={() => setViewType('activity')}
                                className={`px-4 py-2 rounded ${viewType === 'activity' ? 'bg-blue-500' : 'bg-white/5'}`}
                            >
                                Activity
                            </button>
                        </div>
                    </div>

                    {/* Data Display */}
                    {loading ? (
                        <div className="glass-card text-center py-12">
                            <p className="text-white/60">Loading {viewType}...</p>
                        </div>
                    ) : viewType === 'positions' ? (
                        <div className="glass-card">
                            <h3 className="text-lg font-semibold mb-4">Open Positions</h3>
                            {positions.length === 0 ? (
                                <p className="text-white/60 text-center py-8">No positions found</p>
                            ) : (
                                <div className="space-y-3">
                                    {positions.map((pos, idx) => (
                                        <div key={idx} className="bg-white/5 rounded p-4">
                                            <div className="font-semibold mb-2">{pos.title}</div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <div className="text-white/60">Outcome</div>
                                                    <div>{pos.outcome}</div>
                                                </div>
                                                <div>
                                                    <div className="text-white/60">Size</div>
                                                    <div>{pos.size}</div>
                                                </div>
                                                <div>
                                                    <div className="text-white/60">Avg Price</div>
                                                    <div>{(pos.avgPrice * 100).toFixed(1)}¢</div>
                                                </div>
                                                {pos.cashPnl !== undefined && (
                                                    <div>
                                                        <div className="text-white/60">P&L</div>
                                                        <div className={pos.cashPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                            {pos.cashPnl >= 0 ? '+' : ''}${pos.cashPnl.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card overflow-x-auto">
                            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                            {activity.length === 0 ? (
                                <p className="text-white/60 text-center py-8">No activity found</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="text-white/60 border-b border-white/10">
                                        <tr>
                                            <th className="text-left py-2">Time</th>
                                            <th className="text-left py-2">Action</th>
                                            <th className="text-left py-2">Market</th>
                                            <th className="text-right py-2">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activity.map((act, idx) => (
                                            <tr key={idx} className="border-b border-white/5">
                                                <td className="py-2 text-white/60">
                                                    {new Date(act.timestamp * 1000).toLocaleString()}
                                                </td>
                                                <td className="py-2">{act.action}</td>
                                                <td className="py-2 text-sm">{act.outcome}</td>
                                                <td className="py-2 text-right">${act.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
