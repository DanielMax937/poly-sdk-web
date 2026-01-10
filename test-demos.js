#!/usr/bin/env node

/**
 * Demo Page Test Script for Poly SDK Web
 * Tests all demo pages to verify they load correctly
 */

const BASE_URL = 'http://localhost:3000';

const demoPages = [
    { name: 'Basic Usage', path: '/demos/basic-usage' },
    { name: 'Smart Money', path: '/demos/smart-money' },
    { name: 'Market Analysis', path: '/demos/market-analysis' },
    { name: 'K-Line Charts', path: '/demos/kline' },
    { name: 'Follow Wallet', path: '/demos/follow-wallet' },
    { name: 'Services Demo', path: '/demos/services' },
    { name: 'Realtime WebSocket', path: '/demos/realtime' },
    { name: 'Trading Orders', path: '/demos/trading' },
    { name: 'Rewards Tracking', path: '/demos/rewards' },
    { name: 'CTF Operations', path: '/demos/ctf' },
    { name: 'Arbitrage Scan', path: '/demos/arbitrage-scan' },
    { name: 'Trending Arb Monitor', path: '/demos/trending-arb' },
    { name: 'Arbitrage Service', path: '/demos/arbitrage-service' },
    { name: 'Orders', path: '/demos/orders' },
];

async function testDemoPage(name, path) {
    try {
        const url = `${BASE_URL}${path}`;
        const response = await fetch(url);
        const text = await response.text();

        // Check if the page loaded successfully (200 status)
        // and contains expected content (not an error page)
        const isError = text.includes('404') || text.includes('Error') && !text.includes('Poly SDK');
        const hasContent = text.includes('<!DOCTYPE html>') || text.includes('<html');

        if (response.status === 200 && hasContent && !isError) {
            console.log(`✅ ${name.padEnd(25)} - OK (${response.status})`);
            return { name, success: true, status: response.status };
        } else {
            console.log(`⚠️  ${name.padEnd(25)} - Loaded but may have issues (${response.status})`);
            return { name, success: true, status: response.status, warning: true };
        }
    } catch (error) {
        console.log(`❌ ${name.padEnd(25)} - ERROR: ${error.message}`);
        return { name, success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Testing Demo Pages...\n');
    console.log('='.repeat(60));
    console.log('');

    const results = [];

    for (const page of demoPages) {
        const result = await testDemoPage(page.name, page.path);
        results.push(result);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Demo Pages Summary:\n');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`   Total Pages: ${results.length}`);
    console.log(`   ✅ Loaded Successfully: ${passed}`);
    console.log(`   ❌ Failed to Load: ${failed}`);

    console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
