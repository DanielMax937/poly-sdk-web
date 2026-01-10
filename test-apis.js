#!/usr/bin/env node

/**
 * API Test Script for Poly SDK Web
 * Tests all API endpoints to verify they're working correctly
 */

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, url) {
    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log(`\n✅ ${name}`);
        console.log(`   URL: ${url}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);

        if (data.error) {
            console.log(`   ⚠️  Error in response: ${data.error}`);
        }

        return { name, status: response.status, success: !data.error, data };
    } catch (error) {
        console.log(`\n❌ ${name}`);
        console.log(`   URL: ${url}`);
        console.log(`   Error: ${error.message}`);
        return { name, success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Testing Poly SDK Web APIs...\n');
    console.log('='.repeat(60));

    const results = [];

    // TC-1: Markets API
    results.push(await testEndpoint('TC-1.1: Get Trending Markets', `${BASE_URL}/api/markets?limit=10`));
    results.push(await testEndpoint('TC-1.2: Get Market by ID', `${BASE_URL}/api/markets?id=0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917`));
    results.push(await testEndpoint('TC-1.4: Market Not Found (Error Test)', `${BASE_URL}/api/markets?id=nonexistent`));

    // TC-2: Leaderboard API
    results.push(await testEndpoint('TC-2.1: Get Default Leaderboard', `${BASE_URL}/api/leaderboard`));
    results.push(await testEndpoint('TC-2.2: Get Leaderboard (limit=20)', `${BASE_URL}/api/leaderboard?limit=20`));
    results.push(await testEndpoint('TC-2.3: Get Leaderboard (timePeriod=WEEK)', `${BASE_URL}/api/leaderboard?timePeriod=WEEK`));

    // TC-3: Orderbook API
    results.push(await testEndpoint('TC-3.2: Orderbook Missing Param (Error Test)', `${BASE_URL}/api/orderbook`));

    // TC-4: Trades API
    results.push(await testEndpoint('TC-4.1: Get All Trades', `${BASE_URL}/api/trades`));
    results.push(await testEndpoint('TC-4.3: Get Trades (limit=100)', `${BASE_URL}/api/trades?limit=100`));

    // TC-5: Orders API
    results.push(await testEndpoint('TC-5.1: Get Open Orders', `${BASE_URL}/api/orders`));

    // TC-6: Wallet API
    results.push(await testEndpoint('TC-6.3: Wallet Missing Address (Error Test)', `${BASE_URL}/api/wallet`));
    results.push(await testEndpoint('TC-6.1: Get Wallet Positions', `${BASE_URL}/api/wallet?address=0x1234567890123456789012345678901234567890&type=positions`));

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary:\n');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`   Total Tests: ${results.length}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);

    console.log('\n' + '='.repeat(60));
}

runTests().catch(console.error);
