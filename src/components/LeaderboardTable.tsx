interface LeaderboardEntry {
    rank: number;
    address: string;
    pnl: number;
    volume: number;
    positions?: number;
    trades?: number;
    userName?: string;
    profileImage?: string;
}

interface LeaderboardTableProps {
    entries: LeaderboardEntry[];
    onSelectTrader?: (address: string) => void;
    selectedAddress?: string;
}

export function LeaderboardTable({ entries, onSelectTrader, selectedAddress }: LeaderboardTableProps) {
    const formatAddress = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="glass-card overflow-hidden">
            <h3 className="text-lg font-semibold mb-4 gradient-text p-1">Top Traders</h3>
            <div className="overflow-x-auto">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Trader</th>
                            <th>PnL</th>
                            <th>Volume</th>
                            <th>Positions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr
                                key={entry.address}
                                className={`cursor-pointer transition-colors ${selectedAddress === entry.address ? 'bg-blue-500/10' : ''
                                    }`}
                                onClick={() => onSelectTrader?.(entry.address)}
                            >
                                <td>
                                    <span className={`font-bold ${entry.rank <= 3 ? 'text-yellow-400' : ''}`}>
                                        #{entry.rank}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        {entry.profileImage ? (
                                            <img
                                                src={entry.profileImage}
                                                alt=""
                                                className="w-6 h-6 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                                        )}
                                        <div>
                                            <div className="font-mono text-sm">{formatAddress(entry.address)}</div>
                                            {entry.userName && (
                                                <div className="text-xs text-white/50">{entry.userName}</div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={entry.pnl >= 0 ? 'price-up' : 'price-down'}>
                                        ${entry.pnl.toLocaleString()}
                                    </span>
                                </td>
                                <td className="text-white/70">
                                    ${entry.volume.toLocaleString()}
                                </td>
                                <td className="text-white/50">
                                    {entry.positions ?? '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
