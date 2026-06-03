#!/usr/bin/env node

/**
 * xxir Speed Test - Standalone Test Script
 *
 * Run this to verify the xxir speed test engine works
 * before integrating into MySpeed.
 *
 * Usage:  node test-xxir.js [xxir-1|xxir-2]
 */

import { runXxirTest } from './server/util/providers/xxir.js';

const nodeId = process.argv[2] || 'xxir-1';

console.log(`\n🚀 xxir Speed Test Engine - Testing node: ${nodeId}\n`);
console.log('─'.repeat(50));

const startTime = Date.now();

try {
    const result = await runXxirTest(nodeId);

    console.log('\n📊 Test Results:');
    console.log('─'.repeat(50));
    console.log(`  🏓 Ping:      ${result.ping.latency} ms (±${result.ping.jitter} ms)`);
    console.log(`  ⬇️  Download:  ${roundSpeed(result.download.bandwidth)} Mbps`);
    console.log(`  ⬆️  Upload:    ${roundSpeed(result.upload.bandwidth)} Mbps`);
    console.log(`  🖥️  Server:    ${result.server.name}`);
    console.log(`  ⏱️  Total:     ${result.elapsed}s`);
    console.log('─'.repeat(50));

    function roundSpeed(bandwidth) {
        return Math.round(bandwidth / 1250) / 100;
    }

    // Output raw JSON for debugging
    if (process.argv.includes('--json')) {
        console.log('\nRaw JSON:');
        console.log(JSON.stringify(result, null, 2));
    }

    console.log('\n✅ Test completed successfully!\n');
} catch (e) {
    console.error('\n❌ Test failed:', e.message);
    if (process.argv.includes('--verbose')) {
        console.error(e.stack);
    }
    process.exit(1);
}
