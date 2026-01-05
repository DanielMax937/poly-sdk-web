import Link from 'next/link';

const demos = [
  {
    name: 'Basic Usage',
    href: '/demos/basic-usage',
    icon: '📊',
    description: 'Trending markets, orderbook display, and market details'
  },
  {
    name: 'Smart Money',
    href: '/demos/smart-money',
    icon: '💰',
    description: 'Leaderboard, trader positions, and activity tracking'
  },
  {
    name: 'Market Analysis',
    href: '/demos/market-analysis',
    icon: '📈',
    description: 'Analyze markets for arbitrage opportunities'
  },
  {
    name: 'K-Line Charts',
    href: '/demos/kline',
    icon: '📉',
    description: 'Trade data visualization with OHLCV charts'
  },
  {
    name: 'Follow Wallet',
    href: '/demos/follow-wallet',
    icon: '👀',
    description: 'Track smart money positions and exit signals'
  },
  {
    name: 'Services Demo',
    href: '/demos/services',
    icon: '⚡',
    description: 'WalletService and MarketService demonstrations'
  },
  {
    name: 'Realtime WebSocket',
    href: '/demos/realtime',
    icon: '🔴',
    description: 'Live price updates and orderbook changes'
  },
  {
    name: 'Trading Orders',
    href: '/demos/trading',
    icon: '💱',
    description: 'Order form UI for limit and market orders'
  },
  {
    name: 'Rewards Tracking',
    href: '/demos/rewards',
    icon: '🏆',
    description: 'Market making incentives and earnings'
  },
  {
    name: 'CTF Operations',
    href: '/demos/ctf',
    icon: '🔄',
    description: 'Split, merge, and redeem operations info'
  },
  {
    name: 'Arbitrage Scan',
    href: '/demos/arbitrage-scan',
    icon: '🔍',
    description: 'Live scanner for arbitrage opportunities'
  },
  {
    name: 'Trending Arb Monitor',
    href: '/demos/trending-arb',
    icon: '🔥',
    description: 'Monitor top markets for profit opportunities'
  },
  {
    name: 'Arbitrage Service',
    href: '/demos/arbitrage-service',
    icon: '🤖',
    description: 'Full arbitrage workflow dashboard'
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
          Interactive web interface for the{' '}
          <a
            href="https://github.com/cyl19970726/poly-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            @catalyst-team/poly-sdk
          </a>.
          Explore Polymarket data, analyze markets, track smart money, and more.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">API Endpoints Used</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="text-sm font-mono text-blue-400 mb-1">data-api.polymarket.com</div>
            <div className="text-xs text-white/50">Positions, trades, leaderboard</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-sm font-mono text-purple-400 mb-1">gamma-api.polymarket.com</div>
            <div className="text-xs text-white/50">Market discovery, events</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-sm font-mono text-green-400 mb-1">clob.polymarket.com</div>
            <div className="text-xs text-white/50">Orderbook, trading</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Demo Pages</h2>
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
