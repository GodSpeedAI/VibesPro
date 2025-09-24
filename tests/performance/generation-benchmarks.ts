// tests/performance/generation-benchmarks.ts
import { PerformanceMonitor } from '../../tools/performance/monitor';

describe('Generation Performance', () => {
  it('should generate a new application within performance budget', async () => {
    const monitor = new PerformanceMonitor();

    await monitor.measureGenerationTime(async () => {
      // Placeholder for actual generation logic
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    const metrics = monitor.getMetrics();
    expect(metrics.generationTime).toBeLessThan(30000);
  });
});
