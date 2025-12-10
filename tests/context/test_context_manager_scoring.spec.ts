import { AIContextManager, ContextSource } from '../../tools/ai/src/context-manager.js';

describe('AIContextManager scoring integration', () => {
  const buildSource = (
    overrides: Partial<ContextSource> & {
      id: string;
      getContent?: () => Promise<string>;
    },
  ): ContextSource => ({
    id: overrides.id,
    priority: overrides.priority ?? 0.5,
    tags: overrides.tags ?? [],
    lastUpdated: overrides.lastUpdated,
    successRate: overrides.successRate,
    patternConfidence: overrides.patternConfidence,
    provenance: overrides.provenance,
    performanceDelta: overrides.performanceDelta,
    async getContent() {
      if (overrides.getContent) {
        return overrides.getContent();
      }
      return 'default context body';
    },
  });

  it('applies pattern confidence boosts and performance penalties when ranking sources', async () => {
    const manager = await AIContextManager.create({
      maxTokens: 1200,
      reservedTokens: 200,
      weights: {
        relevance: 0.3,
        recency: 0.1,
        success: 0.2,
        priority: 0.05,
        patternConfidence: 0.25,
        performance: 0.1,
      },
    });

    manager.registerSources([
      buildSource({
        id: 'high-confidence-pattern',
        priority: 0.9,
        tags: ['integration', 'hexagonal'],
        patternConfidence: 0.95,
        successRate: 0.9,
        provenance: 'ADR-018',
        async getContent() {
          return 'Hexagonal architecture integration guidance.';
        },
      }),
      buildSource({
        id: 'stale-source',
        priority: 0.7,
        tags: ['integration', 'hexagonal'],
        patternConfidence: 0.6,
        successRate: 0.6,
        lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        async getContent() {
          return 'Older integration note.';
        },
      }),
      buildSource({
        id: 'performance-regressed',
        priority: 0.8,
        tags: ['integration', 'latency'],
        patternConfidence: 0.7,
        successRate: 0.8,
        performanceDelta: 0.45,
        async getContent() {
          return 'Context source with regression warning.';
        },
      }),
    ]);

    const context = await manager.getOptimalContext(
      'Design integration strategy with hexagonal ports',
    );

    // Check that the highest confidence source is ranked first
    expect(context.sources[0]?.id).toBe('high-confidence-pattern');

    // Check that the regressed source is filtered out
    expect(context.sources.some((source) => source.id === 'performance-regressed')).toBe(false);

    // Check confidence is in expected range instead of exact value
    expect(context.sources[0]?.confidence).toBeGreaterThan(0.9);
    expect(context.sources[0]?.confidence).toBeLessThanOrEqual(1.0);

    // Check that the content contains the expected pattern information
    expect(context.content).toContain('Hexagonal architecture');
    expect(context.content).toContain('Confidence:');
  });
});
