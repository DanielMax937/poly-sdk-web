'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const demos = [
    { name: 'Futures Monitoring', href: '/console/futures-monitor', icon: '🛰️' },
    { name: 'Futures Alerts', href: '/console/futures-alerts', icon: '🚨' },
    { name: 'Operations Monitoring', href: '/console/ops-monitoring', icon: '🧪' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0f0f15] md:h-auto md:min-h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="border-b border-white/10 p-4 md:p-6">
                <Link href="/" className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 text-2xl" aria-hidden>🔮</span>
                    <span className="min-w-0 truncate text-lg font-bold gradient-text">Poly SDK Web</span>
                </Link>
            </div>

            <nav className="flex flex-1 flex-col p-3 md:overflow-y-auto md:p-4">
                <div className="sidebar-section-label mb-2 px-3 md:mb-3">
                    Console
                </div>
                <div className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:gap-0 md:space-y-1 md:overflow-visible md:pb-0">
                    {demos.map((demo) => (
                        <Link
                            key={demo.href}
                            href={demo.href}
                            className={`nav-link shrink-0 md:w-full ${pathname === demo.href ? 'active' : ''}`}
                        >
                            <span className="shrink-0">{demo.icon}</span>
                            <span className="whitespace-nowrap">{demo.name}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            <div className="border-t border-white/10 p-3 md:p-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                    <p className="text-xs leading-relaxed text-white/90 break-words">
                        Powered by{' '}
                        <a
                            href="https://github.com/cyl19970726/poly-sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
                        >
                            @catalyst-team/poly-sdk
                        </a>
                    </p>
                </div>
            </div>
        </aside>
    );
}
