'use client';

import { useState } from 'react';
import { PageHeader, StatCard } from '@/components/common';

export default function CTFPage() {
    const [balances] = useState({
        usdc: 1000.00,
        usdcE: 500.00,
        matic: 25.50,
    });

    return (
        <div>
            <PageHeader
                title="CTF Operations"
                subtitle="Split, merge, and redeem operations for conditional tokens"
                badge="Example 10"
            />

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="USDC" value={`$${balances.usdc.toFixed(2)}`} />
                <StatCard label="USDC.e" value={`$${balances.usdcE.toFixed(2)}`} />
                <StatCard label="MATIC" value={`${balances.matic.toFixed(2)}`} />
                <div className="glass-card flex items-center justify-center">
                    <span className="badge badge-green">Ready for CTF</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CTF Operations */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">CTF Operations</h3>

                    <div className="space-y-4">
                        {/* Split */}
                        <div className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">🔀</span>
                                <h4 className="font-semibold">Split</h4>
                            </div>
                            <p className="text-sm text-white/60 mb-3">
                                Convert USDC.e into YES + NO tokens. Each $1 USDC.e becomes 1 YES token and 1 NO token.
                            </p>
                            <code className="text-xs text-blue-400 block p-2 bg-black/30 rounded">
                                await onchain.split(conditionId, &quot;100&quot;);
                            </code>
                        </div>

                        {/* Merge */}
                        <div className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">🔄</span>
                                <h4 className="font-semibold">Merge</h4>
                            </div>
                            <p className="text-sm text-white/60 mb-3">
                                Combine YES + NO tokens back into USDC.e. Used for arbitrage when YES + NO &gt; $1.
                            </p>
                            <code className="text-xs text-blue-400 block p-2 bg-black/30 rounded">
                                await onchain.mergeByTokenIds(conditionId, tokenIds, &quot;100&quot;);
                            </code>
                        </div>

                        {/* Redeem */}
                        <div className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">💵</span>
                                <h4 className="font-semibold">Redeem</h4>
                            </div>
                            <p className="text-sm text-white/60 mb-3">
                                After market resolution, redeem winning tokens for USDC.e. Losing tokens become worthless.
                            </p>
                            <code className="text-xs text-blue-400 block p-2 bg-black/30 rounded">
                                await onchain.redeemByTokenIds(conditionId, tokenIds);
                            </code>
                        </div>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="space-y-4">
                    <div className="glass-card border-yellow-500/30">
                        <h3 className="text-lg font-semibold mb-4 text-yellow-400">⚠️ Important Notes</h3>

                        <div className="space-y-3 text-sm">
                            <div className="p-3 bg-yellow-500/10 rounded-lg">
                                <h4 className="font-semibold mb-1">USDC.e Required</h4>
                                <p className="text-white/60">
                                    Polymarket CTF uses USDC.e (0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174),
                                    not native USDC. Swap on QuickSwap if needed.
                                </p>
                            </div>

                            <div className="p-3 bg-yellow-500/10 rounded-lg">
                                <h4 className="font-semibold mb-1">Approvals Required</h4>
                                <p className="text-white/60">
                                    Before trading, you need to approve the CTF Exchange contract
                                    to spend your tokens.
                                </p>
                            </div>

                            <div className="p-3 bg-yellow-500/10 rounded-lg">
                                <h4 className="font-semibold mb-1">Gas Fees</h4>
                                <p className="text-white/60">
                                    CTF operations require MATIC for gas. Keep some MATIC in your wallet.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DEX Swap */}
                    <div className="glass-card">
                        <h3 className="text-lg font-semibold mb-4 gradient-text">DEX Swap</h3>
                        <p className="text-sm text-white/60 mb-3">
                            The SDK includes QuickSwap V3 integration for swapping tokens.
                        </p>
                        <code className="text-xs text-blue-400 block p-2 bg-black/30 rounded mb-3">
                            await onchain.swap(&quot;MATIC&quot;, &quot;USDC_E&quot;, &quot;50&quot;);
                        </code>
                        <div className="flex gap-2 text-sm">
                            <span className="badge badge-blue">MATIC → USDC.e</span>
                            <span className="badge badge-blue">USDC → USDC.e</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
