interface OrderbookDisplayProps {
    yes: {
        bid: number;
        ask: number;
        bidSize: number;
        askSize: number;
        spread: number;
    };
    no: {
        bid: number;
        ask: number;
        bidSize: number;
        askSize: number;
        spread: number;
    };
    summary: {
        askSum: number;
        bidSum: number;
        longArbProfit: number;
        shortArbProfit: number;
        totalBidDepth: number;
        totalAskDepth: number;
        imbalanceRatio: number;
    };
}

export function OrderbookDisplay({ yes, no, summary }: OrderbookDisplayProps) {
    const hasLongArb = summary.longArbProfit > 0.001;
    const hasShortArb = summary.shortArbProfit > 0.001;

    return (
        <div className="glass-card">
            <h3 className="text-lg font-semibold mb-4 gradient-text">Orderbook</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* YES Token */}
                <div className="space-y-3">
                    <div className="text-sm font-semibold text-white/80">YES Token</div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center orderbook-bid p-2 rounded">
                            <span className="text-xs text-white/60">Bid</span>
                            <span className="font-mono text-green-400">
                                {yes.bid.toFixed(4)} <span className="text-xs text-white/40">({yes.bidSize.toFixed(0)})</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center orderbook-ask p-2 rounded">
                            <span className="text-xs text-white/60">Ask</span>
                            <span className="font-mono text-red-400">
                                {yes.ask.toFixed(4)} <span className="text-xs text-white/40">({yes.askSize.toFixed(0)})</span>
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-white/50">
                            <span>Spread</span>
                            <span>{(yes.spread * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                {/* NO Token */}
                <div className="space-y-3">
                    <div className="text-sm font-semibold text-white/80">NO Token</div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center orderbook-bid p-2 rounded">
                            <span className="text-xs text-white/60">Bid</span>
                            <span className="font-mono text-green-400">
                                {no.bid.toFixed(4)} <span className="text-xs text-white/40">({no.bidSize.toFixed(0)})</span>
                            </span>
                        </div>
                        <div className="flex justify-between items-center orderbook-ask p-2 rounded">
                            <span className="text-xs text-white/60">Ask</span>
                            <span className="font-mono text-red-400">
                                {no.ask.toFixed(4)} <span className="text-xs text-white/40">({no.askSize.toFixed(0)})</span>
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-white/50">
                            <span>Spread</span>
                            <span>{(no.spread * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="text-sm font-semibold text-white/80 mb-3">Summary</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-white/60">Ask Sum (YES+NO)</span>
                        <span className="font-mono">{summary.askSum.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/60">Bid Sum (YES+NO)</span>
                        <span className="font-mono">{summary.bidSum.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/60">Total Bid Depth</span>
                        <span className="font-mono">${summary.totalBidDepth.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/60">Total Ask Depth</span>
                        <span className="font-mono">${summary.totalAskDepth.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/60">Imbalance Ratio</span>
                        <span className="font-mono">{summary.imbalanceRatio.toFixed(2)}</span>
                    </div>
                </div>

                {/* Arbitrage Alerts */}
                {(hasLongArb || hasShortArb) && (
                    <div className="mt-4 space-y-2">
                        {hasLongArb && (
                            <div className="badge badge-green">
                                🎯 Long Arb: {(summary.longArbProfit * 100).toFixed(2)}%
                            </div>
                        )}
                        {hasShortArb && (
                            <div className="badge badge-blue">
                                🎯 Short Arb: {(summary.shortArbProfit * 100).toFixed(2)}%
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
