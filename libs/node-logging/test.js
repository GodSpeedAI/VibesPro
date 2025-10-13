/**
 * Simple smoke test for @vibepro/node-logging
 * Tests basic logger functionality
 */

const assert = require('node:assert');
const { logger } = require('./logger');

console.log('Testing @vibepro/node-logging...');

// Test 1: Logger creation
try {
    const log = logger('test-service');
    assert(log, 'Logger should be created');
    assert(typeof log.info === 'function', 'Logger should have info method');
    assert(typeof log.error === 'function', 'Logger should have error method');
    assert(typeof log.warn === 'function', 'Logger should have warn method');
    console.log('✅ Logger creation test passed');
} catch (err) {
    console.error('❌ Logger creation test failed:', err.message);
    process.exit(1);
}

// Test 2: Logger with default service name
try {
    const log = logger();
    assert(log, 'Logger with default service should be created');
    console.log('✅ Logger with default service test passed');
} catch (err) {
    console.error('❌ Logger with default service test failed:', err.message);
    process.exit(1);
}

// Test 3: Basic logging (doesn't throw)
try {
    const log = logger('test-service');
    log.info('Test message');
    log.warn('Test warning');
    log.error('Test error');
    log.info({ trace_id: 'trace-123', span_id: 'span-456', category: 'audit' }, 'Test with context');
    console.log('✅ Basic logging test passed');
} catch (err) {
    console.error('❌ Basic logging test failed:', err.message);
    process.exit(1);
}

console.log('\n✅ All tests passed!');
