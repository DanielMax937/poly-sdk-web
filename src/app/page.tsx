import Link from 'next/link';

const demos = [
  {
    name: 'Futures Monitoring',
    href: '/console/futures-monitor',
    icon: '🛰️',
    description: 'Commodity keyword scan with sudden movement and insider signals'
  },
  {
    name: 'Futures Alerts',
    href: '/console/futures-alerts',
    icon: '🚨',
    description: '24h server-side tracking with movement and insider alerts'
  },
  {
    name: 'Operations Monitoring',
    href: '/console/ops-monitoring',
    icon: '🧪',
    description: 'Internal API health summary and recent request metrics'
  },
];

export default function HomePage() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Poly SDK Web
        </h1>
        <p className="text-white/70 text-lg max-w-2xl">
          Futures-focused tooling built on{' '}
          <a
            href="https://github.com/cyl19970726/poly-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            @catalyst-team/poly-sdk
          </a>.
          Monitor markets, detect anomalies, and manage alerts.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">API Layers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-4">
            <div className="text-sm font-mono text-blue-400 mb-1">/api/base/*</div>
            <div className="text-xs text-white/50">Capability layer (search, orderbook)</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-sm font-mono text-red-400 mb-1">/api/futures/*</div>
            <div className="text-xs text-white/50">Business layer (monitoring, alerts)</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demos.map((demo) => (
          <Link key={demo.href} href={demo.href}>
            <div className="glass-card h-full group">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{demo.icon}</span>
                <h3 className="font-semibold group-hover:text-blue-400 transition-colors">
                  {demo.name}
                </h3>
              </div>
              <p className="text-sm text-white/50">{demo.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
