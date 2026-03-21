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
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f0f15] border-r border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10">
                <Link href="/" className="flex items-center gap-3">
                    <span className="text-2xl">🔮</span>
                    <span className="text-lg font-bold gradient-text">Poly SDK Web</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">
                    Console
                </div>
                <div className="space-y-1">
                    {demos.map((demo) => (
                        <Link
                            key={demo.href}
                            href={demo.href}
                            className={`nav-link ${pathname === demo.href ? 'active' : ''}`}
                        >
                            <span>{demo.icon}</span>
                            <span>{demo.name}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="glass-card p-3">
                    <p className="text-xs text-white/60">
                        Powered by{' '}
                        <a
                            href="https://github.com/cyl19970726/poly-sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                        >
                            @catalyst-team/poly-sdk
                        </a>
                    </p>
                </div>
            </div>
        </aside>
    );
}
