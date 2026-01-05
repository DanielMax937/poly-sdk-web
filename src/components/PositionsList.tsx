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

interface PositionsListProps {
    positions: Position[];
    loading?: boolean;
}

export function PositionsList({ positions, loading }: PositionsListProps) {
    if (loading) {
        return (
            <div className="glass-card">
                <h3 className="text-lg font-semibold mb-4 gradient-text">Positions</h3>
                <div className="flex justify-center py-8">
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="glass-card">
                <h3 className="text-lg font-semibold mb-4 gradient-text">Positions</h3>
                <p className="text-white/50 text-center py-8">No positions found</p>
            </div>
        );
    }

    return (
        <div className="glass-card">
            <h3 className="text-lg font-semibold mb-4 gradient-text">
                Positions ({positions.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {positions.map((pos, index) => (
                    <div
                        key={`${pos.conditionId}-${index}`}
                        className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 pr-4">
                                <h4 className="text-sm font-medium line-clamp-1">{pos.title}</h4>
                                <span className={`text-xs ${pos.outcome === 'Yes' ? 'text-green-400' : 'text-red-400'}`}>
                                    {pos.outcome}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-mono">{pos.size.toFixed(2)}</div>
                                <div className="text-xs text-white/50">shares</div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs">
                            <div>
                                <span className="text-white/50">Avg: </span>
                                <span className="font-mono">{pos.avgPrice.toFixed(4)}</span>
                            </div>
                            <div>
                                <span className="text-white/50">Cur: </span>
                                <span className="font-mono">{pos.curPrice?.toFixed(4) ?? '-'}</span>
                            </div>
                            <div>
                                <span className="text-white/50">PnL: </span>
                                <span className={`font-mono ${(pos.cashPnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${pos.cashPnl?.toFixed(2) ?? '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
