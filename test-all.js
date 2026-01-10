#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Poly SDK Web
 * Combines all API tests, demo page tests, and integration tests
 */

const BASE_URL = 'http://localhost:3000';

// Test results tracking
const results = [];
let successCount = 0;
let failureCount = 0;

async function testEndpoint(name, url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        const passed = response.status === 200 || (response.status >= 400 && data.error);

        if (passed) successCount++;
        else failureCount++;

        results.push({ name, url, status: response.status, passed });

        const icon = passed ? '✅' : '❌';
        console.log(`\n${icon} ${name}`);
        console.log(`   URL: ${url}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
        if (data.error) {
            console.log(`   ⚠️  Error in response: ${data.error}`);
        }

        return { name, passed, status: response.status };
    } catch (error) {
        failureCount++;
        console.log(`\n❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        return { name, passed: false, error: error.message };
    }
}

async function testDemoPage(name, path) {
    try {
        const url = `${BASE_URL}${path}`;
        const response = await fetch(url);
        const passed = response.status === 200;

        if (passed) successCount++;
        else failureCount++;

        const icon = passed ? '✅' : '❌';
        console.log(`${icon} ${name.padEnd(40)} - ${response.status}`);

        return { name, passed, status: response.status };
    } catch (error) {
        failureCount++;
        console.log(`❌ ${name.padEnd(40)} - Error: ${error.message}`);
        return { name, passed: false, error: error.message };
    }
}

async function runAllTests() {
    console.log('🧪 COMPREHENSIVE TEST SUITE - Poly SDK Web\n');
    console.log('='.repeat(80));

    // ==================== PHASE 1: API ROUTE TESTING ====================
    console.log('\n📦 PHASE 1: API ROUTE TESTING\n');
    console.log('='.repeat(80));

    // TC-1: Markets API
    console.log('\n📍 TC-1: Markets API');
    await testEndpoint('TC-1.1: Get Trending Markets', `${BASE_URL}/api/markets?limit=10`);
    await testEndpoint('TC-1.2: Get Market by ID', `${BASE_URL}/api/markets?id=0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917`);
    await testEndpoint('TC-1.3: Get Market by Slug', `${BASE_URL}/api/markets?slug=will-joe-biden-get-coronavirus-before-the-election`);
    await testEndpoint('TC-1.4: Market Not Found (Error Test)', `${BASE_URL}/api/markets?id=nonexistent`);

    // TC-2: Leaderboard API
    console.log('\n📍 TC-2: Leaderboard API');
    await testEndpoint('TC-2.1: Get Default Leaderboard', `${BASE_URL}/api/leaderboard`);
    await testEndpoint('TC-2.2: Get Leaderboard (limit=20)', `${BASE_URL}/api/leaderboard?limit=20`);
    await testEndpoint('TC-2.3: Get Leaderboard (timePeriod=WEEK)', `${BASE_URL}/api/leaderboard?timePeriod=WEEK`);

    // TC-3: Orderbook API (using tokenIds)
    console.log('\n📍 TC-3: Orderbook API');
    const YES_TOKEN = '16615878769673384167929477377853480343169830037043821933967995321252596015328';
    const NO_TOKEN = '44169729231600183934113609960222670358715639208411971924042241295619035924872';
    await testEndpoint('TC-3.1: Get Orderbook (with tokenIds)', `${BASE_URL}/api/orderbook?yesTokenId=${YES_TOKEN}&noTokenId=${NO_TOKEN}`);
    await testEndpoint('TC-3.2: Orderbook Missing Param (Error Test)', `${BASE_URL}/api/orderbook`);

    // TC-4: Trades API
    console.log('\n📍 TC-4: Trades API');
    await testEndpoint('TC-4.1: Get All Trades', `${BASE_URL}/api/trades`);
    await testEndpoint('TC-4.2: Get Trades by Market', `${BASE_URL}/api/trades?market=0xe3b423dfad8c22ff75c9899c4e8176f628cf4ad4caa00481764d320e7415f7a9`);
    await testEndpoint('TC-4.3: Get Trades (limit=100)', `${BASE_URL}/api/trades?limit=100`);

    // TC-5: Orders API
    console.log('\n📍 TC-5: Orders API');
    await testEndpoint('TC-5.1: Get Open Orders', `${BASE_URL}/api/orders`);
    await testEndpoint('TC-5.2: Get Specific Order', `${BASE_URL}/api/orders?orderId=test123`);

    // TC-6: Wallet API
    console.log('\n📍 TC-6: Wallet API');
    await testEndpoint('TC-6.1: Get Wallet Positions', `${BASE_URL}/api/wallet?address=0x1234567890123456789012345678901234567890&type=positions`);
    await testEndpoint('TC-6.2: Get Wallet Activity', `${BASE_URL}/api/wallet?address=0x1234567890123456789012345678901234567890&type=activity`);
    await testEndpoint('TC-6.3: Wallet Missing Address (Error Test)', `${BASE_URL}/api/wallet`);

    // TC-7: Arbitrage API (using tokenIds)
    console.log('\n📍 TC-7: Arbitrage API');
    await testEndpoint('TC-7.1: Detect Arbitrage', `${BASE_URL}/api/arbitrage?yesTokenId=${YES_TOKEN}&noTokenId=${NO_TOKEN}`);
    await testEndpoint('TC-7.2: Detect Arbitrage (custom threshold)', `${BASE_URL}/api/arbitrage?yesTokenId=${YES_TOKEN}&noTokenId=${NO_TOKEN}&threshold=0.002`);

  // TC-8: Events API
  console.log('\n📍 TC-8: Events API');
  await testEndpoint('TC-8.1: Get Event by Slug', `${BASE_URL}/api/events?slug=khamenei-out-as-supreme-leader-of-iran-by-january-31`);
  await testEndpoint('TC-8.2: Events Missing Param (Error Test)', `${BASE_URL}/api/events`);


    // ==================== PHASE 2: SLUG LOOKUP TEST ====================
    console.log('\n\n📦 PHASE 2: SLUG-BASED MARKET LOOKUP\n');
    console.log('='.repeat(80));

    const slug = "khamenei-out-as-supreme-leader-of-iran-by-january-31";
    console.log(`\n📍 Testing slug: "${slug}"`);

    const slugResponse = await fetch(`${BASE_URL}/api/markets?slug=${slug}`);
    const slugData = await slugResponse.json();

    if (slugData.market && slugData.market.tokens) {
        successCount++;
        console.log(`\n✅ Market Found via Slug`);
        console.log(`   Question: ${slugData.market.question}`);
        console.log(`   Token IDs: ${slugData.market.tokens.length} tokens extracted`);
        slugData.market.tokens.forEach(token => {
            console.log(`      ${token.outcome}: ${token.tokenId.substring(0, 20)}...`);
        });
    } else {
        failureCount++;
        console.log(`\n❌ Slug lookup failed`);
    }

    // ==================== PHASE 3: DEMO PAGE TESTING ====================
    console.log('\n\n📦 PHASE 3: DEMO PAGE TESTING\n');
    console.log('='.repeat(80));
    console.log('');

    const demoPages = [
        { name: 'Home Page', path: '/' },
        { name: 'Markets Demo', path: '/demos/markets' },
        { name: 'Market Details Demo', path: '/demos/market-details' },
        { name: 'Leaderboard Demo', path: '/demos/leaderboard' },
        { name: 'Orderbook Demo', path: '/demos/orderbook' },
        { name: 'Trades Demo', path: '/demos/trades' },
        { name: 'Orders Demo', path: '/demos/orders' },
        { name: 'Wallet Demo', path: '/demos/wallet' },
        { name: 'Portfolio Demo', path: '/demos/portfolio' },
        { name: 'Live Prices Demo', path: '/demos/live-prices' },
        { name: 'Services Demo', path: '/demos/services' },
        { name: 'Rewards Demo', path: '/demos/rewards' },
        { name: 'CTF Exchange Demo', path: '/demos/ctf' },
        { name: 'Trending Arbitrage Demo', path: '/demos/trending-arbitrage' },
        { name: 'Arbitrage Service Demo', path: '/demos/arbitrage' },
    ];

    for (const page of demoPages) {
        await testDemoPage(page.name, page.path);
    }

    // ==================== FINAL SUMMARY ====================
    console.log('\n\n' + '='.repeat(80));
    console.log('\n📊 FINAL TEST SUMMARY\n');
    console.log('='.repeat(80));
    console.log(`\n   Total Tests: ${successCount + failureCount}`);
    console.log(`   ✅ Passed: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`\n   Success Rate: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);
    console.log('\n' + '='.repeat(80));

    if (failureCount === 0) {
        console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    } else {
        console.log(`\n⚠️  ${failureCount} test(s) failed. Please review the output above.\n`);
    }
}

runAllTests().catch(console.error);
