'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common';

interface TestResult {
    endpoint: string;
    status: 'pending' | 'success' | 'error';
    data?: unknown;
    error?: string;
    time?: number;
}

const ENDPOINTS = [
    {
        name: 'Gamma API (Markets)',
        url: 'https://gamma-api.polymarket.com/markets?limit=3&active=true',
    },
    {
        name: 'Data API (Leaderboard)',
        url: 'https://data-api.polymarket.com/leaderboard?limit=3',
    },
    {
        name: 'CLOB API (Info)',
        url: 'https://clob.polymarket.com/',
    },
];

export default function ApiTestPage() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [testing, setTesting] = useState(false);

    async function testEndpoint(endpoint: { name: string; url: string }): Promise<TestResult> {
        const start = Date.now();
        try {
            const res = await fetch(endpoint.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            const time = Date.now() - start;

            if (!res.ok) {
                return {
                    endpoint: endpoint.name,
                    status: 'error',
                    error: `HTTP ${res.status}: ${res.statusText}`,
                    time,
                };
            }

            const data = await res.json();
            return {
                endpoint: endpoint.name,
                status: 'success',
                data,
                time,
            };
        } catch (err) {
            return {
                endpoint: endpoint.name,
                status: 'error',
                error: (err as Error).message,
                time: Date.now() - start,
            };
        }
    }

    async function runAllTests() {
        setTesting(true);
        setResults([]);

        const newResults: TestResult[] = [];
        for (const endpoint of ENDPOINTS) {
            const result = await testEndpoint(endpoint);
            newResults.push(result);
            setResults([...newResults]);
        }

        setTesting(false);
    }

    async function testSingleEndpoint(endpoint: { name: string; url: string }) {
        setTesting(true);
        const result = await testEndpoint(endpoint);
        setResults((prev) => {
            const filtered = prev.filter((r) => r.endpoint !== endpoint.name);
            return [...filtered, result];
        });
        setTesting(false);
    }

    return (
        <div>
            <PageHeader
                title="API Connectivity Test"
                subtitle="Test direct browser requests to Polymarket APIs (no server proxy)"
                badge="Debug"
            />

            {/* Test Buttons */}
            <div className="glass-card mb-6">
                <h3 className="text-lg font-semibold mb-4">Test Endpoints</h3>
                <div className="space-y-3">
                    {ENDPOINTS.map((endpoint) => (
                        <div key={endpoint.name} className="flex items-center gap-4">
                            <button
                                onClick={() => testSingleEndpoint(endpoint)}
                                disabled={testing}
                                className="btn-primary text-sm disabled:opacity-50"
                            >
                                Test {endpoint.name}
                            </button>
                            <code className="text-xs text-white/50 truncate flex-1">
                                {endpoint.url}
                            </code>
                        </div>
                    ))}
                    <hr className="border-white/10 my-4" />
                    <button
                        onClick={runAllTests}
                        disabled={testing}
                        className="btn-primary disabled:opacity-50"
                    >
                        {testing ? '⏳ Testing...' : '🚀 Test All Endpoints'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="glass-card">
                    <h3 className="text-lg font-semibold mb-4">Results</h3>
                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${result.status === 'success'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-red-500/10 border-red-500/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold">{result.endpoint}</span>
                                    <div className="flex items-center gap-2">
                                        {result.time && (
                                            <span className="text-xs text-white/50">
                                                {result.time}ms
                                            </span>
                                        )}
                                        <span
                                            className={`text-sm font-bold ${result.status === 'success'
                                                ? 'text-green-400'
                                                : 'text-red-400'
                                                }`}
                                        >
                                            {result.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}
                                        </span>
                                    </div>
                                </div>

                                {result.error && (
                                    <div className="text-sm text-red-400 mb-2">
                                        Error: {String(result.error)}
                                    </div>
                                )}

                                {result.data !== undefined && (
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-white/60 hover:text-white">
                                            View Response Data
                                        </summary>
                                        <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto max-h-48">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="glass-card mt-6">
                <h3 className="text-lg font-semibold mb-2">ℹ️ What This Tests</h3>
                <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                    <li>Direct browser-to-Polymarket API connectivity</li>
                    <li>CORS headers from Polymarket APIs</li>
                    <li>Network accessibility (geo-blocking, firewalls)</li>
                </ul>
                <p className="text-sm text-white/50 mt-3">
                    If browser requests fail but server requests work, it&apos;s likely a CORS issue.
                    If both fail, it&apos;s likely network/geo-blocking.
                </p>
            </div>
        </div>
    );
}
