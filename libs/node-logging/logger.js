/**
 * VibePro structured logger using pino.
 *
 * Emits JSON logs with mandatory fields:
 * - timestamp (ISO 8601)
 * - level (error, warn, info, debug)
 * - message
 * - trace_id (from context)
 * - span_id (from context)
 * - service
 * - environment
 * - application_version
 * - category (app, audit, security)
 *
 * Usage:
 *   const { logger } = require('@vibepro/node-logging/logger');
 *   const log = logger('my-service');
 *   log.info({ category: 'app', user_id_hash: 'abc123' }, 'request accepted');
 *
 * @see DEV-SDS-018 for schema details
 * @see DEV-PRD-018 for requirements
 */

const pino = require('pino');

/**
 * Create a structured logger instance.
 *
 * @param {string} [service] - Service name (defaults to SERVICE_NAME env var or 'vibepro-node')
 * @returns {pino.Logger} Configured pino logger
 */
function logger(service = process.env.SERVICE_NAME || 'vibepro-node') {
  return pino({
    // Base fields included in every log line
    base: {
      service,
      environment: process.env.APP_ENV || 'local',
      application_version: process.env.APP_VERSION || 'dev',
    },

    // Use 'message' as the message key for consistency
    messageKey: 'message',

    // ISO 8601 timestamps
    timestamp: pino.stdTimeFunctions.isoTime,

    // Custom formatters
    formatters: {
      // Format level as string (not number)
      level(label) {
        return { level: label };
      },

      // Inject trace context and ensure category exists
      log(obj) {
        const result = {
          ...obj,
          trace_id: obj.trace_id || '',
          span_id: obj.span_id || '',
          category: obj.category || 'app',
        };

        // Clean up duplicates from base
        delete result.service;
        delete result.environment;
        delete result.application_version;

        return result;
      },
    },

    // Serialize errors with stack traces
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  });
}

module.exports = { logger };
