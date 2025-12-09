import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MeasureOptions, PerformanceMeasure } from 'node:perf_hooks';
import { performance } from 'node:perf_hooks';
import type { PerformanceAdvisory } from '../../tools/performance/monitor.js';
import { PerformanceMonitor } from '../../tools/performance/monitor.js';

describe('PerformanceMonitor advisories', () => {
  let tempDir: string;
  let baselinePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'perf-monitor-'));
    baselinePath = join(tempDir, 'baselines.json');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(tempDir, { force: true, recursive: true });
  });

  const mockMeasures = (durations: number[]) => {
    const queue = [...durations];
    const spy = jest
      .spyOn(performance, 'measure')
      .mockImplementation(
        (name: string, _startMarkOrOptions?: string | MeasureOptions, _endMark?: string) => {
          const duration = queue.shift() ?? queue[queue.length - 1] ?? 0;
          return {
            name,
            entryType: 'measure',
            startTime: 0,
            duration,
            detail: null,
            endTime: duration,
            toJSON() {
              return {
                name,
                entryType: 'measure',
                startTime: 0,
                duration,
                detail: null,
                endTime: duration,
              };
            },
          } as PerformanceMeasure;
        },
      );
    return spy;
  };

  it('generates advisories when workflow regresses beyond threshold', async () => {
    const measureSpy = mockMeasures([100, 130]);
    const monitor = new PerformanceMonitor({
      baselinePath,
      thresholds: { warn: 0.2, critical: 0.5 },
    });

    await monitor.track('context-loading', async () => 'baseline-run', {
      workflow: 'context-loading',
    });
    await monitor.track('context-loading', async () => 'slow-run', {
      workflow: 'context-loading',
      token: 'secret@example.com',
    });

    const advisories = monitor.getAdvisories();
    expect(advisories.length).toBe(1);

    const advisory = advisories[0] as PerformanceAdvisory;
    expect(advisory.workflow).toBe('context-loading');
    expect(['warn', 'critical']).toContain(advisory.severity);
    expect(advisory.metadata?.token).toBe('[redacted]');
    expect(advisory.deltaPct).toBeGreaterThanOrEqual(0.2);

    const baselines = monitor.getBaselines();
    expect(baselines.get('context-loading')?.samples).toBeGreaterThanOrEqual(2);
    expect(measureSpy).toHaveBeenCalledTimes(2);
  });

  it('persists baselines to disk and reloads for future comparisons', () => {
    let monitor = new PerformanceMonitor({
      baselinePath,
      persist: true,
      thresholds: { warn: 0.2, critical: 0.4 },
    });

    monitor.recordSample('template-generation', 50);

    monitor = new PerformanceMonitor({
      baselinePath,
      persist: true,
      thresholds: { warn: 0.1, critical: 0.4 },
    });
    monitor.recordSample('template-generation', 80);

    const advisories = monitor.getAdvisories();
    expect(advisories.length).toBeGreaterThanOrEqual(1);
    expect(['warn', 'critical']).toContain(advisories[0]?.severity);
  });
});
