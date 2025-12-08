/**
 * @file VibePro structured logger using pino.
 * @author Jules
 * @see DEV-SDS-018 for schema details
 * @see DEV-PRD-018 for requirements
 *
 * @description
 * This module provides a standardized JSON logger for Node.js services within the VibePro ecosystem.
 * It ensures that all log entries are structured with a consistent set of fields, including
 * timestamp, log level, service name, environment, and trace context, facilitating effective
 * log aggregation, searching, and analysis.
 *
 * @example
 * const { logger } = require('@vibepro/node-logging/logger');
 * const log = logger('my-service');
 * log.info({ category: 'app', user_id_hash: 'abc123' }, 'User authentication successful');
 * log.error({ err: new Error('Database connection failed') }, 'Failed to connect to the database');
 */

const pino = require('pino');

/**
 * Creates and configures a pino logger instance with VibePro's standard structured logging format.
 *
 * This function initializes a pino logger with a predefined configuration that structures
 * all log outputs as JSON objects. It automatically includes essential context such as service
 * name, environment, application version, and trace/span IDs. The configuration is optimized
 * for production environments, providing ISO 8601 timestamps and detailed error serialization.
 *
 * @param {string} [service=process.env.SERVICE_NAME || 'vibepro-node'] - The name of the service
 *   generating the logs. This is a crucial field for log aggregation and filtering. If not
 *   provided, it falls back to the `SERVICE_NAME` environment variable, or 'vibepro-node' as a final default.
 * @returns {pino.Logger} A fully configured pino logger instance ready for use.
 */
function logger(service = process.env.SERVICE_NAME || 'vibepro-node') {
  return pino({
    // The 'base' object defines fields that are included in every single log entry.
    base: {
      service,
      environment: process.env.APP_ENV || 'local',
      application_version: process.env.APP_VERSION || 'dev',
    },

    // Specifies 'message' as the key for the main log message string, ensuring
    // consistent field naming across different log events.
    messageKey: 'message',

    // Configures the timestamp to be in ISO 8601 format (e.g., "2023-10-27T10:00:00.000Z"),
    // which is a standard for machine-readable time.
    timestamp: pino.stdTimeFunctions.isoTime,

    // 'formatters' allow for custom modification of the log object before it is written.
    formatters: {
      /**
       * Formats the log level from a number to a string label (e.g., 30 -> 'info').
       * @param {string} label - The string representation of the log level.
       * @returns {{level: string}} An object with the level key.
       */
      level(label) {
        return { level: label };
      },

      /**
       * Injects trace context (trace_id, span_id) and ensures a 'category' exists.
       * It also cleans up redundant fields that are already part of the 'base' object.
       * @param {object} obj - The log object to be formatted.
       * @returns {object} The formatted log object.
       */
      log(obj) {
        const result = {
          ...obj,
          trace_id: obj.trace_id || '', // Ensures trace_id is always present
          span_id: obj.span_id || '', // Ensures span_id is always present
          category: obj.category || 'app', // Defaults category to 'app'
        };

        // These fields are already in 'base', so they are removed from here to avoid duplication.
        delete result.service;
        delete result.environment;
        delete result.application_version;

        return result;
      },
    },

    // 'serializers' define how specific object types are converted to JSON in the log output.
    // This is particularly useful for logging Error objects.
    serializers: {
      // The standard pino error serializer includes the error message, type, and stack trace,
      // which is critical for debugging. Both 'err' and 'error' keys are handled.
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
  });
}

module.exports = { logger };
