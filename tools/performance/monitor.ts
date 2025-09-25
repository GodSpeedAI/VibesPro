// tools/performance/monitor.ts
import { randomUUID } from 'node:crypto';
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
    const startMark = `generation-start-${randomUUID()}`;
    performance.mark(startMark);
    let endMark: string | undefined;
    try {
      const result = await fn();
      endMark = `generation-end-${randomUUID()}`;
      performance.mark(endMark);
      const measure = performance.measure('generationTime', startMark, endMark);
      this.recordMetric(measure.name, measure.duration);
      return result;
    } finally {
      performance.clearMarks(startMark);
      if (endMark) {
        performance.clearMarks(endMark);
      }
      performance.clearMeasures('generationTime');
    }
  }

  async measureBuildTime<T>(fn: () => Promise<T>): Promise<T> {
    const startMark = `build-start-${randomUUID()}`;
    performance.mark(startMark);
    let endMark: string | undefined;
    try {
      const result = await fn();
      endMark = `build-end-${randomUUID()}`;
      performance.mark(endMark);
      const measure = performance.measure('buildTime', startMark, endMark);
      this.recordMetric(measure.name, measure.duration);
      return result;
    } finally {
      performance.clearMarks(startMark);
      if (endMark) {
        performance.clearMarks(endMark);
      }
      performance.clearMeasures('buildTime');
    }
  }
  }

  async measureBuildTime<T>(fn: () => Promise<T>): Promise<T> {
    const startMark = `build-start-${randomUUID()}`;
    performance.mark(startMark);
    let endMark: string | undefined;
    try {
      const result = await fn();
      endMark = `build-end-${randomUUID()}`;
      performance.mark(endMark);
      performance.measure('buildTime', startMark, endMark);
      return result;
    } finally {
      performance.clearMarks(startMark);
      if (endMark) {
        performance.clearMarks(endMark);
      }
      performance.clearMeasures('buildTime');
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
