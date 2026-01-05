export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="spinner mb-4" />
            <p className="text-white/50">{text}</p>
        </div>
    );
}

export function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="glass-card border-red-500/30">
            <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                    <h3 className="font-semibold text-red-400">Error</h3>
                    <p className="text-white/70 text-sm">{message}</p>
                </div>
            </div>
        </div>
    );
}

export function PageHeader({
    title,
    subtitle,
    badge
}: {
    title: string;
    subtitle?: string;
    badge?: string;
}) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold gradient-text">{title}</h1>
                {badge && <span className="badge badge-blue">{badge}</span>}
            </div>
            {subtitle && (
                <p className="text-white/60">{subtitle}</p>
            )}
        </div>
    );
}

export function StatCard({
    label,
    value,
    subValue,
    trend
}: {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
}) {
    return (
        <div className="glass-card">
            <div className="text-sm text-white/50 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${trend === 'up' ? 'text-green-400' :
                    trend === 'down' ? 'text-red-400' : ''
                }`}>
                {value}
            </div>
            {subValue && <div className="text-xs text-white/40 mt-1">{subValue}</div>}
        </div>
    );
}
