import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { performance, PerformanceObserver } from 'node:perf_hooks';
import { dirname, resolve } from 'node:path';

type Severity = 'info' | 'warn' | 'critical';

export interface PerformanceMonitorOptions {
  baselinePath?: string;
  thresholds?: {
    warn: number;
    critical: number;
  };
  persist?: boolean;
  maxHistory?: number;
}

export interface PerformanceSample {
  workflow: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceAdvisory {
  id: string;
  workflow: string;
  severity: Severity;
  baseline: number;
  observed: number;
  deltaPct: number;
  thresholdPct: number;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface BaselineEntry {
  baseline: number;
  samples: number;
  lastObserved: number;
}

interface PersistedState {
  baselines: Record<string, BaselineEntry>;
}

const DEFAULT_THRESHOLDS = {
  warn: 0.25,
  critical: 0.5
};

export class PerformanceMonitor {
  private readonly baselinePath: string;
  private readonly thresholds = DEFAULT_THRESHOLDS;
  private readonly persist: boolean;
  private readonly maxHistory: number;
  private readonly baselines = new Map<string, BaselineEntry>();
  private readonly advisories: PerformanceAdvisory[] = [];
  private readonly history: PerformanceSample[] = [];
  private persisting = false;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.baselinePath = resolve(options.baselinePath ?? 'tmp/performance-baselines.json');
    this.thresholds = {
      warn: options.thresholds?.warn ?? DEFAULT_THRESHOLDS.warn,
      critical: options.thresholds?.critical ?? DEFAULT_THRESHOLDS.critical
    };
    this.persist = options.persist ?? true;
    this.maxHistory = Math.max(5, options.maxHistory ?? 40);

    this.loadState();
    this.setupObservers();
  }

  async track<T>(workflow: string, fn: () => Promise<T>, metadata: Record<string, unknown> = {}): Promise<T> {
    const startMark = `${workflow}-start-${randomUUID()}`;
    const endMark = `${workflow}-end-${randomUUID()}`;
    performance.mark(startMark);
    try {
      const result = await fn();
      performance.mark(endMark);
      const measureName = `${workflow}-duration`;
      const entry = performance.measure(measureName, startMark, endMark);
      this.recordSample(workflow, entry.duration, metadata);
      performance.clearMeasures(measureName);
      return result;
    } finally {
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
    }
  }

  async measureGenerationTime<T>(fn: () => Promise<T>): Promise<T> {
    return this.track('generation', fn, { category: 'generation' });
  }

  async measureBuildTime<T>(fn: () => Promise<T>): Promise<T> {
    return this.track('build', fn, { category: 'build' });
  }

  recordSample(workflow: string, duration: number, metadata: Record<string, unknown> = {}): void {
    if (!Number.isFinite(duration) || duration < 0) {
      console.debug(`[PerformanceMonitor] Dropped sample for workflow "${workflow}" due to invalid duration:`, duration, 'metadata:', metadata);
      return;
    }

    const sanitizedMetadata = this.sanitizeMetadata(metadata);
    const timestamp = new Date().toISOString();
    this.history.push({ workflow, duration, timestamp, metadata: sanitizedMetadata });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const existing = this.baselines.get(workflow);
    const updatedBaseline = this.updateBaseline(existing, duration);
    this.baselines.set(workflow, updatedBaseline);

    if (existing) {
      const delta = (duration - existing.baseline) / Math.max(existing.baseline, 1);
      const severity = this.calculateSeverity(delta);
      if (severity !== 'info') {
        const advisory = this.createAdvisory({
          workflow,
          duration,
          baseline: existing.baseline,
          delta,
          threshold: severity === 'critical' ? this.thresholds.critical : this.thresholds.warn,
          metadata: sanitizedMetadata,
          severity
        });
        this.advisories.push(advisory);
      }
    }

    if (this.persist) {
      this.persistState();
    }
  }

  getAdvisories(): PerformanceAdvisory[] {
    return [...this.advisories].sort((a, b) => b.deltaPct - a.deltaPct);
  }

  clearAdvisories(): void {
    this.advisories.length = 0;
  }

  getBaselines(): Map<string, BaselineEntry> {
    return new Map(this.baselines);
  }

  getHistory(): PerformanceSample[] {
    return [...this.history];
  }

  getMetrics(): Record<string, number> {
    const snapshot: Record<string, number> = {};
    this.baselines.forEach((entry, workflow) => {
      snapshot[`${workflow}:baseline`] = Number(entry.baseline.toFixed(2));
      snapshot[`${workflow}:last`] = Number(entry.lastObserved.toFixed(2));
    });
    return snapshot;
  }

  private setupObservers(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // Handle both single entries and arrays of entries
      if (!entries) return;

      const entriesArray = Array.isArray(entries) ? entries : [entries];
      for (const entry of entriesArray) {
        const workflow = entry.name.replace(/-duration$/u, '');
        this.recordSample(workflow, entry.duration);
      }
    });
    observer.observe({ entryTypes: ['measure'], buffered: true });
  }

  private loadState(): void {
    try {
      const data = readFileSync(this.baselinePath, 'utf-8');
      const parsed: PersistedState = JSON.parse(data);
      Object.entries(parsed.baselines).forEach(([workflow, baseline]) => {
        this.baselines.set(workflow, baseline);
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private persistState(): void {
    // Skip if already persisting to prevent race conditions
    if (this.persisting) {
      return;
    }

    this.persisting = true;
    try {
      const directory = dirname(this.baselinePath);
      mkdirSync(directory, { recursive: true });
      const payload: PersistedState = {
        baselines: Object.fromEntries(this.baselines.entries())
      };
      writeFileSync(this.baselinePath, JSON.stringify(payload, null, 2));
    } finally {
      this.persisting = false;
    }
  }

  private updateBaseline(existing: BaselineEntry | undefined, duration: number): BaselineEntry {
    if (!existing) {
      return {
        baseline: duration,
        samples: 1,
        lastObserved: duration
      };
    }

    const smoothing = 0.2;
    const baseline = existing.baseline * (1 - smoothing) + duration * smoothing;
    return {
      baseline,
      samples: existing.samples + 1,
      lastObserved: duration
    };
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/iu.test(value) || key.toLowerCase().includes('token')) {
          result[key] = '[redacted]';
        } else {
          result[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private calculateSeverity(delta: number): Severity {
    if (delta >= this.thresholds.critical) {
      return 'critical';
    }
    if (delta >= this.thresholds.warn) {
      return 'warn';
    }
    return 'info';
  }

  private createAdvisory(params: {
    workflow: string;
    duration: number;
    baseline: number;
    delta: number;
    threshold: number;
    metadata: Record<string, unknown>;
    severity: Severity;
  }): PerformanceAdvisory {
    const { workflow, duration, baseline, delta, threshold, metadata, severity } = params;
    const message = `Workflow '${workflow}' regressed by ${(delta * 100).toFixed(1)}% against baseline ${baseline.toFixed(2)}ms.`;
    return {
      id: randomUUID(),
      workflow,
      severity,
      baseline,
      observed: duration,
      deltaPct: delta,
      thresholdPct: threshold,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };
  }
}
