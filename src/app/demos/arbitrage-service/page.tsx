'use client';

import { useState } from 'react';
import { PageHeader, StatCard } from '@/components/common';

interface Position {
    market: string;
    side: 'YES' | 'NO';
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
}

export default function ArbitrageServicePage() {
    const [isRunning, setIsRunning] = useState(false);
    const [autoExecute, setAutoExecute] = useState(false);
    const [positions, setPositions] = useState<Position[]>([]);
    const [log, setLog] = useState<string[]>([]);

    function addLog(message: string) {
        const timestamp = new Date().toLocaleTimeString();
        setLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
    }

    function startService() {
        setIsRunning(true);
        addLog('ArbitrageService started');
        addLog('Connecting to WebSocket...');

        setTimeout(() => addLog('WebSocket connected'), 500);
        setTimeout(() => addLog('Subscribing to 10 top markets...'), 1000);
        setTimeout(() => addLog('Real-time monitoring active'), 1500);
    }

    function stopService() {
        setIsRunning(false);
        addLog('Stopping ArbitrageService...');
        setTimeout(() => addLog('WebSocket disconnected'), 300);
        setTimeout(() => addLog('ArbitrageService stopped'), 500);
    }

    function clearPositions() {
        setPositions([]);
        addLog('All positions cleared');
    }

    return (
        <div>
            <PageHeader
                title="Arbitrage Service"
                subtitle="Full arbitrage workflow dashboard with auto-execution"
                badge="Example 13"
            />

            {/* Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Service Status"
                    value={isRunning ? 'Running' : 'Stopped'}
                    trend={isRunning ? 'up' : 'neutral'}
                />
                <StatCard
                    label="Open Positions"
                    value={positions.length}
                />
                <StatCard
                    label="Total PnL"
                    value="$0.00"
                    subValue="Demo mode"
                />
                <div className="glass-card">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-white/60">Auto Execute</span>
                        <button
                            onClick={() => setAutoExecute(!autoExecute)}
                            disabled
                            className={`w-12 h-6 rounded-full transition-colors ${autoExecute ? 'bg-green-500' : 'bg-white/20'
                                } cursor-not-allowed opacity-50`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${autoExecute ? 'translate-x-6' : ''
                                }`} />
                        </button>
                    </div>
                    <p className="text-xs text-white/40">Disabled in demo mode</p>
                </div>
            </div>

            {/* Main Controls */}
            <div className="glass-card mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold">Arbitrage Service</h3>
                        <p className="text-sm text-white/50">
                            {isRunning
                                ? 'Monitoring markets for arbitrage opportunities'
                                : 'Start the service to begin monitoring'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={isRunning ? stopService : startService}
                            className={isRunning ? 'btn-secondary' : 'btn-primary'}
                        >
                            {isRunning ? '⏹ Stop' : '▶️ Start'}
                        </button>
                        <button
                            onClick={clearPositions}
                            className="btn-secondary"
                            disabled={positions.length === 0}
                        >
                            🧹 Clear Positions
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workflow Steps */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Workflow</h3>

                    <div className="space-y-3">
                        <div className={`p-3 rounded-lg ${isRunning ? 'bg-green-500/10' : 'bg-white/5'}`}>
                            <div className="flex items-center gap-2">
                                <span className={isRunning ? 'text-green-400' : 'text-white/50'}>
                                    {isRunning ? '✓' : '○'}
                                </span>
                                <span className="font-semibold">1. Scan Markets</span>
                            </div>
                            <p className="text-xs text-white/50 ml-6">
                                Continuously monitor top markets for opportunities
                            </p>
                        </div>

                        <div className={`p-3 rounded-lg ${isRunning ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                            <div className="flex items-center gap-2">
                                <span className={isRunning ? 'text-blue-400' : 'text-white/50'}>
                                    {isRunning ? '↻' : '○'}
                                </span>
                                <span className="font-semibold">2. Real-time Monitoring</span>
                            </div>
                            <p className="text-xs text-white/50 ml-6">
                                WebSocket price updates for instant detection
                            </p>
                        </div>

                        <div className={`p-3 rounded-lg bg-white/5`}>
                            <div className="flex items-center gap-2">
                                <span className="text-white/50">○</span>
                                <span className="font-semibold">3. Auto-Execute</span>
                            </div>
                            <p className="text-xs text-white/50 ml-6">
                                Automatically execute profitable arbitrage (disabled)
                            </p>
                        </div>

                        <div className={`p-3 rounded-lg bg-white/5`}>
                            <div className="flex items-center gap-2">
                                <span className="text-white/50">○</span>
                                <span className="font-semibold">4. Position Management</span>
                            </div>
                            <p className="text-xs text-white/50 ml-6">
                                Track and close arbitrage positions
                            </p>
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4 gradient-text">Activity Log</h3>

                    <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-sm">
                        {log.length === 0 ? (
                            <p className="text-white/50 text-center py-8">
                                Start the service to see activity
                            </p>
                        ) : (
                            log.map((entry, index) => (
                                <div key={index} className="text-white/70 py-1">
                                    {entry}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* SDK Methods */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-4 gradient-text">ArbitrageService API</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">start()</code>
                        <p className="text-xs text-white/50 mt-1">
                            Begin monitoring with WebSocket
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">stop()</code>
                        <p className="text-xs text-white/50 mt-1">
                            Stop monitoring and disconnect
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">scanOnce()</code>
                        <p className="text-xs text-white/50 mt-1">
                            One-time market scan
                        </p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                        <code className="text-blue-400 text-sm">execute(opp)</code>
                        <p className="text-xs text-white/50 mt-1">
                            Execute an arbitrage opportunity
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
