'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common';

export default function PortfolioPage() {
    const [address, setAddress] = useState('');
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalValue: 0,
        totalPnl: 0,
        openPositions: 0,
        winRate: 0,
    });

    async function loadPortfolio() {
        if (!address) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/wallet?address=${address}&type=positions`);
            const data = await res.json();
            const positions = data.positions || [];

            setPositions(positions);

            // Calculate stats
            const totalValue = positions.reduce((sum: number, p: any) => sum + (p.size * (p.curPrice || p.avgPrice)), 0);
            const totalPnl = positions.reduce((sum: number, p: any) => sum + (p.cashPnl || 0), 0);
            const winners = positions.filter((p: any) => (p.cashPnl || 0) > 0).length;

            setStats({
                totalValue,
                totalPnl,
                openPositions: positions.length,
                winRate: positions.length > 0 ? (winners / positions.length) * 100 : 0,
            });
        } catch (error) {
            console.error('Failed to load portfolio:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <PageHeader
                title="Portfolio Overview"
                subtitle="Comprehensive view of your Polymarket positions"
                badge="Portfolio"
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
                    <button onClick={loadPortfolio} className="btn-primary">
                        Load Portfolio
                    </button>
                </div>
            </div>

            {address && !loading && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="glass-card">
                            <div className="text-sm text-white/60 mb-1">Total Value</div>
                            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
                        </div>
                        <div className="glass-card">
                            <div className="text-sm text-white/60 mb-1">Total P&L</div>
                            <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
                            </div>
                        </div>
                        <div className="glass-card">
                            <div className="text-sm text-white/60 mb-1">Open Positions</div>
                            <div className="text-2xl font-bold">{stats.openPositions}</div>
                        </div>
                        <div className="glass-card">
                            <div className="text-sm text-white/60 mb-1">Win Rate</div>
                            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                        </div>
                    </div>

                    {/* Positions List */}
                    <div className="glass-card">
                        <h3 className="text-lg font-semibold mb-4">Positions</h3>
                        {positions.length === 0 ? (
                            <p className="text-white/60 text-center py-8">No positions found</p>
                        ) : (
                            <div className="space-y-3">
                                {positions.map((pos: any, idx: number) => (
                                    <div key={idx} className="bg-white/5 rounded p-4 hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="font-semibold">{pos.title}</div>
                                                <div className="text-sm text-white/60 mt-1">{pos.outcome}</div>
                                            </div>
                                            {pos.cashPnl !== undefined && (
                                                <div className={`text-lg font-bold ${pos.cashPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {pos.cashPnl >= 0 ? '+' : ''}${pos.cashPnl.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <div className="text-white/60">Size</div>
                                                <div className="font-mono">{pos.size}</div>
                                            </div>
                                            <div>
                                                <div className="text-white/60">Avg Price</div>
                                                <div className="font-mono">{(pos.avgPrice * 100).toFixed(1)}¢</div>
                                            </div>
                                            <div>
                                                <div className="text-white/60">Value</div>
                                                <div className="font-mono">${(pos.size * (pos.curPrice || pos.avgPrice)).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {loading && (
                <div className="glass-card text-center py-12">
                    <p className="text-white/60">Loading portfolio...</p>
                </div>
            )}
        </div>
    );
}
