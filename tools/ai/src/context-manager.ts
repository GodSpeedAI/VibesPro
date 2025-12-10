const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'with',
  'for',
  'from',
  'into',
  'onto',
  'about',
  'without',
  'to',
  'of',
  'in',
  'on',
  'by',
  'is',
  'are',
  'be',
  'create',
  'build',
  'make',
]);

const DOMAIN_GLOSSARY: Record<string, string> = {
  account: 'user',
  accounts: 'user',
  billing: 'billing',
  customer: 'user',
  customers: 'user',
  event: 'events',
  events: 'events',
  inventory: 'inventory',
  order: 'order',
  orders: 'order',
  payment: 'billing',
  payments: 'billing',
  project: 'project',
  projects: 'project',
  specification: 'specifications',
  specs: 'specifications',
  user: 'user',
  users: 'user',
};

const MIN_SCORE_THRESHOLD = 0.6;

export interface AIContextManagerWeights {
  relevance: number;
  recency: number;
  success: number;
  priority: number;
  patternConfidence: number;
  performance: number;
}

interface TaskAnalysis {
  readonly keywords: readonly string[];
  readonly taskType: 'implementation' | 'analysis' | 'testing' | 'refactor' | 'documentation';
  readonly complexity: 'low' | 'medium' | 'high';
  readonly domains: readonly string[];
  readonly requiredPatterns: readonly string[];
}

interface RankedSource {
  readonly source: ContextSource;
  readonly score: number;
  readonly tokens: number;
  readonly content: string;
}

interface SelectedSource extends RankedSource {
  readonly content: string;
  readonly tokens: number;
}

interface CachedContext {
  readonly content: string;
  readonly tokenCount: number;
  readonly relevanceScore: number;
  readonly sources: Array<{
    id: string;
    score: number;
    tokens: number;
    confidence?: number;
    provenance?: string;
    performanceDelta?: number;
  }>;
}

class SimpleTokenizer {
  tokenize(text: string): string[] {
    if (!text) {
      return [];
    }

    return text
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter((token) => token.length > 0 && !STOP_WORDS.has(token));
  }

  count(text: string): number {
    return this.tokenize(text).length;
  }

  trim(text: string, maxTokens: number): { content: string; tokens: number } {
    if (maxTokens <= 0) {
      return { content: '', tokens: 0 };
    }

    const tokens = this.tokenize(text);
    if (tokens.length <= maxTokens) {
      return { content: text.trim(), tokens: tokens.length };
    }

    const trimmedTokens = tokens.slice(0, maxTokens);
    return {
      content: trimmedTokens.join(' '),
      tokens: trimmedTokens.length,
    };
  }
}

export interface ContextSource {
  readonly id: string;
  readonly priority: number;
  readonly tags: readonly string[];
  readonly lastUpdated?: Date;
  readonly successRate?: number;
  readonly patternConfidence?: number;
  readonly provenance?: string;
  readonly performanceDelta?: number;
  getContent(): Promise<string>;
}

export interface ContextSourceMetrics {
  readonly tokenCost: number;
  readonly score: number;
  readonly confidence?: number;
}

export interface ContextSelectionResult {
  content: string;
  tokenCount: number;
  relevanceScore: number;
  sources: Array<{
    id: string;
    score: number;
    tokens: number;
    confidence?: number;
    provenance?: string;
    performanceDelta?: number;
  }>;
  fromCache: boolean;
}

export interface AIContextManagerConfig {
  maxTokens: number;
  reservedTokens?: number;
  cacheSize?: number;
  weights?: Partial<AIContextManagerWeights>;
  /** Optional Aider CLI integration */
  aider?: import('./aider/types.js').AiderConfig;
}

export class AIContextManager {
  private readonly maxTokens: number;
  private readonly reservedTokens: number;
  private readonly tokenizer = new SimpleTokenizer();
  private readonly sources = new Map<string, ContextSource>();
  private readonly metrics = new Map<string, ContextSourceMetrics>();
  private readonly cache = new Map<string, CachedContext>();
  private readonly cacheOrder: string[] = [];
  private readonly cacheSize: number;
  private readonly weights: AIContextManagerWeights;

  constructor(config: AIContextManagerConfig) {
    if (config.maxTokens <= 0) {
      throw new Error('maxTokens must be greater than zero');
    }

    if (config.reservedTokens && config.reservedTokens >= config.maxTokens) {
      throw new Error('reservedTokens must be less than maxTokens');
    }

    this.maxTokens = config.maxTokens;
    this.reservedTokens = config.reservedTokens ?? 0;
    this.cacheSize = Math.max(1, config.cacheSize ?? 32);

    // Set default weights and merge with provided weights
    const defaultWeights = {
      relevance: 0.4,
      recency: 0.15,
      success: 0.15,
      priority: 0.1,
      patternConfidence: 0.15,
      performance: 0.05,
    };

    this.weights = {
      ...defaultWeights,
      ...config.weights,
    };

    // Validate weights
    this.validateWeights(this.weights);
  }

  static async create(config: AIContextManagerConfig): Promise<AIContextManager> {
    const manager = new AIContextManager(config);

    // Auto-register Aider context source if enabled
    if (config.aider?.enabled) {
      try {
        const { AiderContextSource } = await import('./aider/context-source.js');
        manager.registerSource(new AiderContextSource(config.aider));
        console.log('[AIContextManager] Aider context source registered');
      } catch (err) {
        console.warn('[AIContextManager] Failed to load Aider module:', err);
      }
    }

    return manager;
  }

  registerSource(source: ContextSource): void {
    this.sources.set(source.id, {
      ...source,
      priority: this.normalizePriority(source.priority),
    });
    this.clearCache();
  }

  registerSources(sources: ContextSource[]): void {
    sources.forEach((source) => this.registerSource(source));
  }

  removeSource(sourceId: string): void {
    this.sources.delete(sourceId);
    this.metrics.delete(sourceId);
    this.clearCache();
  }

  getSourceMetrics(): Map<string, ContextSourceMetrics> {
    return new Map(this.metrics);
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheOrder.length = 0;
  }

  async getOptimalContext(task: string): Promise<ContextSelectionResult> {
    const cacheKey = this.createCacheKey(task);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return {
        ...cached,
        fromCache: true,
      };
    }

    const analysis = this.analyzeTask(task);
    const rankedSources = await this.rankSources(analysis);
    const selectedSources = this.selectWithinBudget(rankedSources);

    const content = this.composeContext(selectedSources);
    const tokenCount = this.tokenizer.count(content);
    const relevanceScore = this.calculateAggregateScore(selectedSources);
    const normalizedSources = selectedSources.map((entry) => ({
      id: entry.source.id,
      score: Number(entry.score.toFixed(4)),
      tokens: entry.tokens,
      confidence: entry.source.patternConfidence,
      provenance: entry.source.provenance,
      performanceDelta: entry.source.performanceDelta,
    }));

    const result: ContextSelectionResult = {
      content,
      tokenCount,
      relevanceScore: Number(relevanceScore.toFixed(4)),
      sources: normalizedSources,
      fromCache: false,
    };

    this.storeInCache(cacheKey, result);
    return result;
  }

  private analyzeTask(task: string): TaskAnalysis {
    const tokens = this.tokenizer.tokenize(task);
    const uniqueTokens = Array.from(new Set(tokens));

    return {
      keywords: uniqueTokens,
      taskType: this.classifyTask(uniqueTokens),
      complexity: this.assessComplexity(tokens.length),
      domains: this.extractDomains(uniqueTokens),
      requiredPatterns: this.identifyPatterns(uniqueTokens),
    };
  }

  private classifyTask(keywords: readonly string[]): TaskAnalysis['taskType'] {
    if (keywords.some((token) => token.includes('test') || token.includes('validate'))) {
      return 'testing';
    }

    if (keywords.some((token) => token.includes('refactor'))) {
      return 'refactor';
    }

    if (keywords.some((token) => token.includes('doc') || token.includes('write'))) {
      return 'documentation';
    }

    if (keywords.some((token) => token.includes('analyse') || token.includes('analyze'))) {
      return 'analysis';
    }

    return 'implementation';
  }

  private assessComplexity(tokenCount: number): TaskAnalysis['complexity'] {
    if (tokenCount <= 8) {
      return 'low';
    }

    if (tokenCount <= 20) {
      return 'medium';
    }

    return 'high';
  }

  private extractDomains(keywords: readonly string[]): string[] {
    const domains = new Set<string>();

    for (const keyword of keywords) {
      const normalized = DOMAIN_GLOSSARY[keyword];
      if (normalized) {
        domains.add(normalized);
      }
    }

    return Array.from(domains);
  }

  private identifyPatterns(keywords: readonly string[]): string[] {
    const patterns = new Set<string>();

    const keywordSet = new Set(keywords);
    if (keywordSet.has('entity')) {
      patterns.add('entity');
    }
    if (keywordSet.has('value') && keywordSet.has('object')) {
      patterns.add('value-object');
    }
    if (keywordSet.has('event') || keywordSet.has('events')) {
      patterns.add('domain-event');
    }
    if (keywordSet.has('port') || keywordSet.has('adapter')) {
      patterns.add('port-adapter');
    }
    if (keywordSet.has('aggregate')) {
      patterns.add('aggregate');
    }
    if (keywordSet.has('use') && keywordSet.has('case')) {
      patterns.add('use-case');
    }

    return Array.from(patterns);
  }

  private async rankSources(analysis: TaskAnalysis): Promise<RankedSource[]> {
    const ranked: RankedSource[] = [];

    for (const source of this.sources.values()) {
      const rawContent = (await source.getContent())?.trim() ?? '';
      if (!rawContent) {
        continue;
      }

      const tokens = this.tokenizer.count(rawContent);
      const relevance = this.calculateRelevance(source, analysis, rawContent);
      const recency = this.getRecencyScore(source);
      const success = this.getSuccessScore(source);
      const patternConfidence = this.getPatternConfidenceScore(source);
      const performancePenalty = this.getPerformancePenalty(source);
      const weightedScore =
        relevance * this.weights.relevance +
        recency * this.weights.recency +
        success * this.weights.success +
        source.priority * this.weights.priority +
        patternConfidence * this.weights.patternConfidence;
      const score = this.clamp(weightedScore - performancePenalty * this.weights.performance, 0, 1);

      ranked.push({
        source,
        score,
        tokens,
        content: rawContent,
      });

      this.metrics.set(source.id, {
        tokenCost: tokens,
        score,
        confidence: patternConfidence,
      });
    }

    return ranked.sort((a, b) => b.score - a.score);
  }

  private selectWithinBudget(ranked: RankedSource[]): SelectedSource[] {
    const availableTokens = Math.max(0, this.maxTokens - this.reservedTokens);
    let remainingTokens = availableTokens;
    const selected: SelectedSource[] = [];

    for (const entry of ranked) {
      if (remainingTokens <= 0) {
        break;
      }

      if (entry.score < MIN_SCORE_THRESHOLD && selected.length > 0) {
        continue;
      }

      if (entry.tokens <= remainingTokens) {
        selected.push({ ...entry });
        remainingTokens -= entry.tokens;
      } else if (remainingTokens > 0) {
        const compressed = this.tokenizer.trim(entry.content, remainingTokens);
        if (compressed.tokens > 0) {
          selected.push({
            ...entry,
            content: compressed.content,
            tokens: compressed.tokens,
          });
          remainingTokens -= compressed.tokens;
        }
      }
    }

    if (selected.length === 0 && ranked.length > 0) {
      const best = ranked[0];
      if (!best) {
        return selected;
      }
      const capped =
        best.tokens <= availableTokens
          ? best
          : {
              ...best,
              ...this.tokenizer.trim(best.content, availableTokens),
            };

      if (capped.source) {
        selected.push({
          ...best,
          content: capped.content,
          tokens: capped.tokens,
          source: capped.source,
        });
      }
    }

    return selected;
  }

  private composeContext(selected: SelectedSource[]): string {
    if (selected.length === 0) {
      return '';
    }

    const sections = selected.map((entry) => {
      const header = `### Source: ${entry.source.id}`;
      const metadata = this.composeSourceMetadata(entry);
      const body = metadata ? `${metadata}\n${entry.content.trim()}` : entry.content.trim();
      return `${header}\n${body}`;
    });

    return sections.join('\n\n');
  }

  private calculateAggregateScore(selected: SelectedSource[]): number {
    if (selected.length === 0) {
      return 0;
    }

    const totalTokens = selected.reduce((accumulator, entry) => accumulator + entry.tokens, 0);
    if (totalTokens === 0) {
      return 0;
    }

    const weightedScore = selected.reduce(
      (accumulator, entry) => accumulator + entry.score * entry.tokens,
      0,
    );
    return weightedScore / totalTokens;
  }

  private calculateRelevance(
    source: ContextSource,
    analysis: TaskAnalysis,
    content: string,
  ): number {
    const keywords = new Set([
      ...analysis.keywords,
      ...analysis.domains,
      ...analysis.requiredPatterns,
    ]);

    const normalizedTags = this.expandTags(source.tags);
    const tagMatches = normalizedTags.filter((tag) => keywords.has(tag));
    const tagCoverage =
      normalizedTags.length === 0 ? 0.4 : tagMatches.length / normalizedTags.length;

    const contentTokens = new Set(this.tokenizer.tokenize(content));
    const contentMatches = Array.from(contentTokens).filter((token) => keywords.has(token)).length;
    const keywordBaseline = keywords.size === 0 ? 1 : keywords.size;
    const contentScore = Math.min(1, contentMatches / keywordBaseline);

    const domainAffinity = analysis.domains.some((domain) => normalizedTags.includes(domain))
      ? 0.1
      : 0;
    const patternAffinity =
      analysis.requiredPatterns.filter((pattern) => normalizedTags.includes(pattern)).length > 0
        ? 0.05
        : 0;

    let base = tagCoverage * 0.7 + contentScore * 0.3 + domainAffinity + patternAffinity;
    if (normalizedTags.length > 0 && tagMatches.length === normalizedTags.length) {
      base += 0.15;
    }

    return this.clamp(base + Math.min(source.priority * 0.1, 0.1), 0, 1);
  }

  private getRecencyScore(source: ContextSource): number {
    if (!source.lastUpdated) {
      return 0.5;
    }

    const ageMinutes = (Date.now() - source.lastUpdated.getTime()) / 60000;

    if (ageMinutes <= 60) {
      return 1;
    }
    if (ageMinutes <= 360) {
      return 0.85;
    }
    if (ageMinutes <= 1440) {
      return 0.7;
    }
    if (ageMinutes <= 4320) {
      return 0.5;
    }

    return 0.3;
  }

  private getSuccessScore(source: ContextSource): number {
    if (source.successRate === undefined) {
      return 0.5;
    }

    return this.clamp(source.successRate, 0, 1);
  }

  private getPatternConfidenceScore(source: ContextSource): number {
    if (source.patternConfidence === undefined) {
      return 0.5;
    }

    return this.clamp(source.patternConfidence, 0, 1);
  }

  private getPerformancePenalty(source: ContextSource): number {
    if (source.performanceDelta === undefined || source.performanceDelta <= 0) {
      return 0;
    }

    return this.clamp(source.performanceDelta, 0, 1);
  }

  private expandTags(tags: readonly string[]): string[] {
    const expanded = new Set<string>();

    for (const tag of tags) {
      const lower = tag.toLowerCase();
      expanded.add(lower);

      const parts = lower.split(/[:/_-]/);
      parts.forEach((part) => {
        if (part) {
          expanded.add(part);
        }
      });
    }

    return Array.from(expanded);
  }

  private normalizePriority(priority: number): number {
    return this.clamp(priority, 0, 1);
  }

  private validateWeights(weights: AIContextManagerWeights): void {
    // Check that all weights are positive numbers
    for (const [key, value] of Object.entries(weights)) {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`Weight for ${key} must be a non-negative number, got ${value}`);
      }
    }

    // Check that weights sum to approximately 1.0 (with some tolerance for floating point errors)
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error(`Weights must sum to 1.0, current sum is ${sum.toFixed(4)}`);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private createCacheKey(task: string): string {
    const fingerprint = Array.from(this.sources.values())
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((source) => {
        const lastUpdated = source.lastUpdated ? source.lastUpdated.getTime() : 0;
        const success = source.successRate ?? 0;
        const confidence = source.patternConfidence ?? 0.5;
        const performance = source.performanceDelta ?? 0;
        return `${source.id}:${lastUpdated}:${success.toFixed(4)}:${confidence.toFixed(
          4,
        )}:${performance.toFixed(4)}`;
      })
      .join('|');

    return `${task.toLowerCase().trim()}::${fingerprint}`;
  }

  private storeInCache(cacheKey: string, result: ContextSelectionResult): void {
    if (!this.cache.has(cacheKey) && this.cache.size >= this.cacheSize) {
      const oldestKey = this.cacheOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const snapshot: CachedContext = {
      content: result.content,
      tokenCount: result.tokenCount,
      relevanceScore: result.relevanceScore,
      sources: result.sources,
    };

    this.cache.set(cacheKey, snapshot);
    this.cacheOrder.push(cacheKey);
  }

  private composeSourceMetadata(entry: SelectedSource): string | null {
    const fragments: string[] = [];
    if (entry.source.provenance) {
      fragments.push(`Provenance: ${entry.source.provenance}`);
    }
    if (entry.source.patternConfidence !== undefined) {
      fragments.push(`Confidence: ${(entry.source.patternConfidence * 100).toFixed(1)}%`);
    }
    if (entry.source.successRate !== undefined) {
      fragments.push(`Success Rate: ${(entry.source.successRate * 100).toFixed(1)}%`);
    }
    if (entry.source.performanceDelta !== undefined && entry.source.performanceDelta > 0) {
      fragments.push(`Performance Delta: ${(entry.source.performanceDelta * 100).toFixed(1)}%`);
    }

    return fragments.length > 0 ? fragments.join(' | ') : null;
  }
}
