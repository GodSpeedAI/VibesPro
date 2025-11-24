/**
 * @file Smoke test for the @vibepro/node-logging module.
 * @author Jules
 *
 * @description
 * This script provides a basic set of smoke tests to verify the core functionality of the
 * VibePro logger. It ensures that the logger can be created with and without a service name,
 * that it has the expected logging methods, and that calling these methods does not cause
 * the application to crash.
 *
 * This is not a comprehensive unit test suite but rather a quick verification that the
 * logger is behaving as expected in a minimal environment. It is intended to be run
 * directly with Node.js.
 *
 * @example
 * // To run this test:
 * // node libs/node-logging/test.js
 */

const assert = require('node:assert');
const { logger } = require('./logger');

console.log('Testing @vibepro/node-logging...');

// --- Test Case 1: Logger Creation ---
// Verifies that the logger factory function successfully creates a logger instance
// and that the instance has the expected API methods (info, error, warn).
try {
  const log = logger('test-service');
  assert(log, 'Logger instance should be successfully created.');
  assert(typeof log.info === 'function', 'Logger instance should have an "info" method.');
  assert(typeof log.error === 'function', 'Logger instance should have an "error" method.');
  assert(typeof log.warn === 'function', 'Logger instance should have a "warn" method.');
  console.log('✅ Test Case 1/3: Logger creation passed.');
} catch (err) {
  console.error('❌ Test Case 1/3: Logger creation failed:', err.message);
  process.exit(1);
}

// --- Test Case 2: Logger with Default Service Name ---
// Ensures that the logger can be instantiated without an explicit service name,
// relying on the default fallback mechanism (environment variables or a hardcoded default).
try {
  const log = logger();
  assert(log, 'Logger with default service name should be created.');
  console.log('✅ Test Case 2/3: Logger with default service passed.');
} catch (err) {
  console.error('❌ Test Case 2/3: Logger with default service failed:', err.message);
  process.exit(1);
}

// --- Test Case 3: Basic Logging Functionality ---
// This test confirms that the basic logging methods can be called without throwing errors.
// It covers standard logging, as well as logging with additional context like trace IDs.
try {
  const log = logger('test-service');
  log.info('This is a test message.');
  log.warn('This is a test warning.');
  log.error(new Error('This is a test error.'), 'Test error with an error object.');
  log.info({ trace_id: 'trace-123', span_id: 'span-456', category: 'audit' }, 'Test with context.');
  console.log('✅ Test Case 3/3: Basic logging functionality passed.');
} catch (err) {
  console.error('❌ Test Case 3/3: Basic logging functionality failed:', err.message);
  process.exit(1);
}

console.log('\n✅ All @vibepro/node-logging smoke tests passed!');
