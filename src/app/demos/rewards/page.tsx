'use client';

import { useState } from 'react';
import { PageHeader, StatCard } from '@/components/common';

export default function RewardsPage() {
    const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Simulated rewards data
    const rewardsData = {
        currentRewards: 125.50,
        weeklyEarnings: 892.75,
        monthlyEarnings: 3456.00,
        scoringOrders: 12,
        totalOrders: 45,
    };

    const earningsHistory = [
        { date: '2024-12-07', amount: 45.20, orders: 8 },
        { date: '2024-12-06', amount: 52.80, orders: 10 },
        { date: '2024-12-05', amount: 38.50, orders: 6 },
        { date: '2024-12-04', amount: 61.30, orders: 12 },
        { date: '2024-12-03', amount: 48.90, orders: 9 },
    ];

    return (
        <div>
            <PageHeader
                title="Rewards Tracking"
                subtitle="Market making incentives and earnings"
                badge="Example 09"
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Current Rewards"
                    value={`$${rewardsData.currentRewards.toFixed(2)}`}
                    trend="up"
                />
                <StatCard
                    label="Weekly Earnings"
                    value={`$${rewardsData.weeklyEarnings.toFixed(2)}`}
                />
                <StatCard
                    label="Monthly Earnings"
                    value={`$${rewardsData.monthlyEarnings.toFixed(2)}`}
                />
                <StatCard
                    label="Scoring Orders"
                    value={`${rewardsData.scoringOrders}/${rewardsData.totalOrders}`}
                    subValue="Orders currently earning rewards"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* How Rewards Work */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">How Rewards Work</h3>

                    <div className="space-y-4 text-sm">
                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-blue-400 mb-1">📊 Order Scoring</h4>
                            <p className="text-white/60">
                                Orders that provide liquidity near the market price are scored.
                                The closer to the midpoint and the larger the size, the higher the score.
                            </p>
                        </div>

                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-green-400 mb-1">💰 Reward Distribution</h4>
                            <p className="text-white/60">
                                Rewards are distributed proportionally based on your score
                                relative to other market makers.
                            </p>
                        </div>

                        <div className="p-3 bg-white/5 rounded-lg">
                            <h4 className="font-semibold text-purple-400 mb-1">⏰ Daily Settlement</h4>
                            <p className="text-white/60">
                                Rewards are calculated and distributed daily. Check your
                                earnings history for past payouts.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Earnings History */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Earnings History</h3>

                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Earnings</th>
                                    <th>Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earningsHistory.map((entry) => (
                                    <tr key={entry.date}>
                                        <td className="text-white/70">{entry.date}</td>
                                        <td className="text-green-400 font-mono">${entry.amount.toFixed(2)}</td>
                                        <td>{entry.orders}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* API Methods */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-4 gradient-text">SDK Methods</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">isOrderScoring(orderId)</code>
                        <p className="text-xs text-white/50 mt-1">
                            Check if an order is currently earning rewards
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">getCurrentRewards()</code>
                        <p className="text-xs text-white/50 mt-1">
                            Get current accumulated rewards
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">getEarnings(date)</code>
                        <p className="text-xs text-white/50 mt-1">
                            Get earnings for a specific date
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
