// tools/performance/monitor.ts
import { performance, PerformanceObserver } from 'perf_hooks';

interface PerformanceMetrics {
  generationTime: number;
  buildTime: number;
  memoryUsage: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    generationTime: 0,
    buildTime: 0,
    memoryUsage: 0,
  };

  constructor() {
    this.setupObservers();
  }

  private setupObservers(): void {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration);
      }
    });

    obs.observe({ entryTypes: ['measure'] });
  }

  async measureGenerationTime<T>(fn: () => Promise<T>): Promise<T> {
    performance.mark('generation-start');
    try {
      const result = await fn();
      performance.mark('generation-end');
      performance.measure('generationTime', 'generation-start', 'generation-end');
      return result;
    } finally {
        //
    }
  }

  async measureBuildTime<T>(fn: () => Promise<T>): Promise<T> {
    performance.mark('build-start');
    try {
      const result = await fn();
      performance.mark('build-end');
      performance.measure('buildTime', 'build-start', 'build-end');
      return result;
    } finally {
        //
    }
  }

  private recordMetric(name: string, duration: number): void {
    if (name in this.metrics) {
      this.metrics[name as keyof PerformanceMetrics] = duration;
    }
  }

  getMetrics(): PerformanceMetrics {
    this.metrics.memoryUsage = process.memoryUsage().heapUsed;
    return { ...this.metrics };
  }
}
