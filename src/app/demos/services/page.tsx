'use client';

import { useEffect, useState } from 'react';
import { PageHeader, LoadingSpinner, ErrorMessage, StatCard } from '@/components/common';

interface WalletProfile {
    address: string;
    totalPnL: number;
    smartScore: number;
    positionCount: number;
    lastActiveAt: string;
}

interface MarketSignal {
    type: string;
    severity: string;
}

export default function ServicesPage() {
    const [topTraders, setTopTraders] = useState<{ rank: number; address: string; pnl: number; volume: number }[]>([]);
    const [walletProfile, setWalletProfile] = useState<WalletProfile | null>(null);
    const [activeWallets, setActiveWallets] = useState<{ address: string; tradeCount: number }[]>([]);
    const [trendingMarket, setTrendingMarket] = useState<{ question: string; conditionId: string } | null>(null);
    const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch top traders
                const tradersRes = await fetch('/api/leaderboard?limit=5');
                const tradersData = await tradersRes.json();
                const traders = tradersData.leaderboard?.entries || [];
                setTopTraders(traders);

                // Fetch wallet profile for top trader
                if (traders.length > 0) {
                    const profileRes = await fetch(`/api/wallet?address=${traders[0].address}&type=profile`);
                    const profileData = await profileRes.json();
                    setWalletProfile(profileData.profile || null);
                }

                // Fetch trending market
                const marketRes = await fetch('/api/markets?limit=1');
                const marketData = await marketRes.json();
                if (marketData.markets?.[0]) {
                    setTrendingMarket(marketData.markets[0]);
                }

                // Discover active wallets from trades
                const tradesRes = await fetch('/api/trades?limit=100');
                const tradesData = await tradesRes.json();
                const trades = tradesData.trades || [];

                const walletCounts = new Map<string, number>();
                for (const trade of trades) {
                    if (trade.proxyWallet) {
                        walletCounts.set(trade.proxyWallet, (walletCounts.get(trade.proxyWallet) || 0) + 1);
                    }
                }

                const sortedWallets = [...walletCounts.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([address, tradeCount]) => ({ address, tradeCount }));
                setActiveWallets(sortedWallets);

                setLoading(false);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner text="Loading services demo..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div>
            <PageHeader
                title="Services Demo"
                subtitle="Demonstrating WalletService and MarketService functionality"
                badge="Example 06"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* WalletService Demo */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold gradient-text">WalletService</h2>

                    {/* Top Traders */}
                    <div className="glass-card">
                        <h3 className="font-semibold mb-3">Top Traders</h3>
                        <div className="space-y-2">
                            {topTraders.map((trader) => (
                                <div key={trader.address} className="flex justify-between items-center p-2 bg-white/5 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-400">#{trader.rank}</span>
                                        <span className="font-mono text-sm">
                                            {trader.address.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 text-sm">${trader.pnl.toLocaleString()}</div>
                                        <div className="text-xs text-white/50">Vol: ${trader.volume.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Wallet Profile */}
                    {walletProfile && (
                        <div className="glass-card">
                            <h3 className="font-semibold mb-3">Wallet Profile</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-white/50">Address</span>
                                    <p className="font-mono">{walletProfile.address.slice(0, 12)}...</p>
                                </div>
                                <div>
                                    <span className="text-white/50">Total PnL</span>
                                    <p className="text-green-400">${walletProfile.totalPnL.toFixed(2)}</p>
                                </div>
                                <div>
                                    <span className="text-white/50">Smart Score</span>
                                    <p className="text-blue-400">{walletProfile.smartScore}/100</p>
                                </div>
                                <div>
                                    <span className="text-white/50">Positions</span>
                                    <p>{walletProfile.positionCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Wallets */}
                    <div className="glass-card">
                        <h3 className="font-semibold mb-3">Active Wallets (from trades)</h3>
                        <div className="space-y-2">
                            {activeWallets.map((wallet) => (
                                <div key={wallet.address} className="flex justify-between items-center text-sm">
                                    <span className="font-mono">{wallet.address.slice(0, 8)}...{wallet.address.slice(-4)}</span>
                                    <span className="badge badge-blue">{wallet.tradeCount} trades</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MarketService Demo */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold gradient-text">MarketService</h2>

                    {/* Trending Market */}
                    {trendingMarket && (
                        <div className="glass-card">
                            <h3 className="font-semibold mb-3">Trending Market</h3>
                            <p className="text-sm mb-2">{trendingMarket.question}</p>
                            <p className="text-xs text-white/50 font-mono">
                                {trendingMarket.conditionId.slice(0, 24)}...
                            </p>
                        </div>
                    )}

                    {/* K-Lines Info */}
                    <div className="glass-card">
                        <h3 className="font-semibold mb-3">K-Line Data</h3>
                        <p className="text-sm text-white/60 mb-4">
                            K-Lines are aggregated from trade data. Use the K-Line demo page for full visualization.
                        </p>
                        <a href="/demos/kline" className="btn-secondary inline-block text-sm">
                            View K-Lines →
                        </a>
                    </div>

                    {/* Market Signals */}
                    <div className="glass-card">
                        <h3 className="font-semibold mb-3">Market Signals</h3>
                        <p className="text-sm text-white/60">
                            Market signals include arbitrage opportunities, price movements, and volume spikes.
                            Use the Market Analysis page to scan for signals.
                        </p>
                        <a href="/demos/market-analysis" className="btn-secondary inline-block text-sm mt-4">
                            Analyze Markets →
                        </a>
                    </div>

                    {/* Arbitrage Detection */}
                    <div className="glass-card">
                        <h3 className="font-semibold mb-3">Arbitrage Detection</h3>
                        <p className="text-sm text-white/60 mb-4">
                            The SDK can detect when YES + NO ask prices sum to less than 1.00 (long arb)
                            or bid prices sum to more than 1.00 (short arb).
                        </p>
                        <div className="flex gap-2">
                            <span className="badge badge-green">Long Arb: Buy YES + NO</span>
                            <span className="badge badge-blue">Short Arb: Sell YES + NO</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
