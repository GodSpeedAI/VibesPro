# Observability Port

This port defines the contract for interacting with the observability infrastructure.

## Interface

```typescript
interface ObservabilityStack {
  /**
   * Check the configuration and health of the observability system.
   * Verifies environment variables and connectivity.
   */
  check(): Promise<HealthCheckResult>;

  /**
   * Run a demonstration sequence to verify log/trace ingestion.
   */
  runDemo(): Promise<void>;

  /**
   * Manage the local OpenObserve stack.
   */
  stack: {
    start(): Promise<void>;
    stop(): Promise<void>;
    status(): Promise<StackStatus>;
  };
}

interface HealthCheckResult {
  logfireConfigured: boolean;
  openObserveReachable: boolean;
  envVarsPresent: string[];
}

interface StackStatus {
  running: boolean;
  services: {
    name: string;
    state: 'running' | 'stopped' | 'exited';
  }[];
}
```
