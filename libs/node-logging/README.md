# @vibepro/node-logging

Structured JSON logging library for VibePro Node.js applications with automatic trace correlation.

## Features

- ✅ JSON-first structured logging
- ✅ Automatic trace context injection (`trace_id`, `span_id`)
- ✅ Consistent schema across Rust/Node/Python
- ✅ Category-based routing (`app`, `audit`, `security`)
- ✅ Environment metadata (`service`, `environment`, `application_version`)
- ✅ PII-safe (redacted by Vector pipeline)

## Installation

```bash
cd libs/node-logging
pnpm install
```

## Usage

### Basic Logging

```javascript
const { logger } = require('@vibepro/node-logging/logger');

const log = logger('my-service');

// App log
log.info({ category: 'app', user_id_hash: 'abc123' }, 'request accepted');

// Security log
log.warn({ category: 'security', action: 'rate_limit' }, 'client throttled');

// Error log with stack trace
log.error({ category: 'app', code: 500, err: new Error('Timeout') }, 'upstream timeout');
```

### With Trace Context

```javascript
const log = logger('my-service');

// Inject trace context from OpenTelemetry or headers
log.info(
    {
        trace_id: 'abc123def456...',
        span_id: '789ghi...',
        category: 'app',
        user_id: 'user-123',
    },
    'user action performed',
);
```

### Log Levels

- `log.error()` - Error conditions
- `log.warn()` - Warning conditions
- `log.info()` - Informational messages (default)
- `log.debug()` - Debug-level messages

### Log Categories

- `app` (default) - Application behavior, business logic
- `audit` - Compliance/audit trail (longer retention)
- `security` - Security events (immediate alerting)

## Schema

Every log line includes:

```json
{
    "timestamp": "2025-10-12T16:00:00.000Z",
    "level": "info",
    "message": "request accepted",
    "trace_id": "abc123def456...",
    "span_id": "789ghi...",
    "service": "user-api",
    "environment": "staging",
    "application_version": "v1.2.3",
    "category": "app",
    "user_id_hash": "abc123"
}
```

## Environment Variables

- `SERVICE_NAME` - Service name (default: `vibepro-node`)
- `APP_ENV` - Environment (default: `local`)
- `APP_VERSION` - Application version (default: `dev`)

## PII Protection

The following fields are automatically redacted by the Vector pipeline:

- `user_id`, `user_email`, `email`, `username`, `name`
- `phone`, `phone_number`, `ssn`, `ip_address`
- `authorization`, `Authorization`
- `password`, `token`, `api_key`
  **Never log PII directly.** Use hashed values (e.g., `user_id_hash`) instead.

## Trace Correlation

Logs are automatically correlated with traces when:

1. `VIBEPRO_OBSERVE=1` is set
2. Code runs within an active tracing span
3. `trace_id` and `span_id` are injected by OpenTelemetry instrumentation

## References

- [DEV-ADR-017](/docs/specs/observability/observability.adr.md#dev-adr-017) - Architecture Decision
- [DEV-PRD-018](/docs/specs/observability/observability.prd.md#dev-prd-018) - Product Requirements
- [DEV-SDS-018](/docs/specs/observability/observability.sds.md#dev-sds-018) - Software Design Spec
- [Logging Policy](/docs/ENVIRONMENT.md#logging-policy) - Operational Guidelines

## Testing

```bash
pnpm test
```

Or use the quick-start tool:

```bash
node ../../tools/logging/test_pino.js
```

## License

MIT
