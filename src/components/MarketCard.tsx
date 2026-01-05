interface MarketCardProps {
    question: string;
    slug?: string;
    volume?: number;
    volume24hr?: number;
    yesPrice?: number;
    noPrice?: number;
    conditionId: string;
    onClick?: () => void;
    selected?: boolean;
}

export function MarketCard({
    question,
    slug,
    volume,
    volume24hr,
    yesPrice = 0.5,
    noPrice = 0.5,
    onClick,
    selected,
}: MarketCardProps) {
    return (
        <div
            className={`glass-card cursor-pointer ${selected ? 'border-blue-500' : ''}`}
            onClick={onClick}
        >
            <h3 className="font-semibold mb-3 text-white line-clamp-2">{question}</h3>

            {slug && (
                <p className="text-xs text-white/40 mb-4 truncate">{slug}</p>
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="text-center">
                    <div className="text-2xl font-bold price-up">
                        {(yesPrice * 100).toFixed(1)}¢
                    </div>
                    <div className="text-xs text-white/60">YES</div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-center">
                    <div className="text-2xl font-bold price-down">
                        {(noPrice * 100).toFixed(1)}¢
                    </div>
                    <div className="text-xs text-white/60">NO</div>
                </div>
            </div>

            <div className="flex justify-between text-xs text-white/60">
                {volume !== undefined && (
                    <span>Vol: ${volume.toLocaleString()}</span>
                )}
                {volume24hr !== undefined && (
                    <span>24h: ${volume24hr.toLocaleString()}</span>
                )}
            </div>
        </div>
    );
}
