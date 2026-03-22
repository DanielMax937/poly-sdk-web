export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-16">
            <div className="spinner" />
            <p className="text-center text-sm text-white/85 min-h-[1.25rem]">{text}</p>
        </div>
    );
}

export function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="glass-card border-red-500/40 bg-red-950/20">
            <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>⚠️</span>
                <div className="min-w-0">
                    <h3 className="font-semibold text-red-300">Error</h3>
                    <p className="mt-1 text-sm text-white/85">{message}</p>
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
        <header className="mb-8">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="min-w-0 max-w-full break-words text-2xl font-bold gradient-text sm:text-3xl">
                        {title}
                    </h1>
                    {badge && (
                        <span className="badge badge-blue shrink-0">{badge}</span>
                    )}
                </div>
                {subtitle && (
                    <p className="mt-3 max-w-4xl text-[15px] leading-relaxed text-white/80">
                        {subtitle}
                    </p>
                )}
            </div>
        </header>
    );
}

export function StatCard({
    label,
    value,
    subValue,
    trend,
    valueClassName,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    /** Overrides trend-based coloring when set */
    valueClassName?: string;
}) {
    const trendClass =
        trend === 'up'
            ? 'text-emerald-400'
            : trend === 'down'
              ? 'text-red-400'
              : 'text-white';

    return (
        <div className="glass-card flex min-h-[104px] flex-col justify-center">
            <div className="mb-1 text-sm text-white/65">{label}</div>
            <div className={`text-2xl font-bold tabular-nums ${valueClassName ?? trendClass}`}>
                {value}
            </div>
            {subValue && <div className="mt-1 text-xs text-white/55">{subValue}</div>}
        </div>
    );
}
