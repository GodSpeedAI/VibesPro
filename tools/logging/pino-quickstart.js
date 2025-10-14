#!/usr/bin/env node
/**
 * Pino logger quick-start example
 * Tests: DEV-SDS-018 (Node logging implementation)
 *
 * Usage:
 *   node tools/logging/pino-quickstart.js
 *
 * Expected output: JSON logs with trace correlation fields
 */

const { logger } = require('../../libs/node-logging/logger');

// Create logger with custom service name
const log = logger('quickstart-demo');

// Simulate trace context (in real apps, this comes from OpenTelemetry)
const traceContext = {
    trace_id: '4bf92f3577b34da6a3ce929d0e0e4736',
    span_id: '00f067aa0ba902b7'
};

console.log('==> Testing VibePro Node logging (pino)\n');

// App logs
log.info(
    { ...traceContext, category: 'app', user_id_hash: 'user_abc123' },
    'request accepted'
);

log.info(
    { ...traceContext, category: 'app', duration_ms: 45, status: 200 },
    'request completed'
);

// Security log
log.warn(
    { ...traceContext, category: 'security', action: 'rate_limit', client_ip_hash: '192.168.1.1' },
    'client throttled'
);

// Error log
log.error(
    { ...traceContext, category: 'app', code: 500, error: 'ECONNREFUSED' },
    'upstream timeout'
);

// Audit log
log.info(
    { ...traceContext, category: 'audit', user_id_hash: 'admin_xyz789', action: 'user_delete' },
    'admin action performed'
);

console.log('\n==> ✅ Pino logging test complete');
console.log('Expected fields in each line: timestamp, level, message, trace_id, span_id, service, environment, application_version, category');
