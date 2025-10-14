import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PerformanceMonitor } from '../../tools/performance/monitor.js';
import type { PerformanceAdvisory } from '../../tools/performance/monitor.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('PerformanceMonitor advisories', () => {
  let tempDir: string;
  let baselinePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'perf-monitor-'));
    baselinePath = join(tempDir, 'baselines.json');
  });

  afterEach(() => {
    rmSync(tempDir, { force: true, recursive: true });
  });

  it('generates advisories when workflow regresses beyond threshold', async () => {
    const monitor = new PerformanceMonitor({ baselinePath, thresholds: { warn: 0.2, critical: 0.5 } });

    await monitor.track('context-loading', async () => {
      await delay(10);
    }, { workflow: 'context-loading' });

    await monitor.track('context-loading', async () => {
      await delay(30);
    }, { workflow: 'context-loading', token: 'secret@example.com' });

    const advisories = monitor.getAdvisories();
    expect(advisories.length).toBe(1);

    const advisory = advisories[0] as PerformanceAdvisory;
    expect(advisory.workflow).toBe('context-loading');
    expect(['warn', 'critical']).toContain(advisory.severity);
    expect(advisory.metadata?.token).toBe('[redacted]');
    expect(advisory.deltaPct).toBeGreaterThanOrEqual(0.2);

    const baselines = monitor.getBaselines();
    expect(baselines.get('context-loading')?.samples).toBeGreaterThanOrEqual(2);
  });

  it('persists baselines to disk and reloads for future comparisons', async () => {
    let monitor = new PerformanceMonitor({ baselinePath, persist: true, thresholds: { warn: 0.2, critical: 0.4 } });

    await monitor.track('template-generation', async () => {
      await delay(12);
    });

    monitor = new PerformanceMonitor({ baselinePath, persist: true, thresholds: { warn: 0.1, critical: 0.4 } });
    await monitor.track('template-generation', async () => {
      await delay(20);
    });

    const advisories = monitor.getAdvisories();
    expect(advisories.length).toBeGreaterThanOrEqual(1);
    expect(['warn', 'critical']).toContain(advisories[0]?.severity);
  });
});
