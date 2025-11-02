import { describe, expect, it } from 'vitest';
import { AIContextManager, ContextSource } from '../context-manager.js';

describe('AIContextManager', () => {
  const buildSource = (overrides: Partial<ContextSource> & { id: string }): ContextSource => ({
    id: overrides.id,
    priority: overrides.priority ?? 0.5,
    tags: overrides.tags ?? [],
    lastUpdated: overrides.lastUpdated ?? new Date(),
    successRate: overrides.successRate ?? 0.5,
    async getContent() {
      if (overrides.getContent) {
        return await overrides.getContent();
      }

      return 'generic context content';
    },
  });

  it('should provide optimal context within token budget', async () => {
    const manager = new AIContextManager({
      maxTokens: 8000,
      reservedTokens: 2000,
    });

    const sources: ContextSource[] = [
      buildSource({
        id: 'domain-user-guide',
        priority: 0.95,
        tags: ['domain:user', 'entity', 'validation'],
        lastUpdated: new Date(Date.now() - 5 * 60 * 1000),
        successRate: 0.98,
        getContent: async () =>
          'User entity guidelines with invariants, validation rules, aggregate boundaries, and ubiquitous language.',
      }),
      buildSource({
        id: 'architecture-patterns',
        priority: 0.85,
        tags: ['hexagonal', 'port-adapter', 'application'],
        lastUpdated: new Date(Date.now() - 60 * 60 * 1000),
        successRate: 0.9,
        getContent: async () =>
          'Hexagonal architecture guidance focusing on use case orchestration and domain isolation.',
      }),
      buildSource({
        id: 'irrelevant-notes',
        priority: 0.2,
        tags: ['frontend', 'styling'],
        successRate: 0.1,
        getContent: async () => 'Styling tips for marketing pages.',
      }),
    ];

    sources.forEach((source) => manager.registerSource(source));

    const context = await manager.getOptimalContext(
      'Create user entity with validation and domain events',
    );

    expect(context.tokenCount).toBeLessThanOrEqual(6000);
    expect(context.relevanceScore).toBeGreaterThan(0.8);
    expect(context.sources.map((source) => source.id)).toContain('domain-user-guide');
    expect(context.sources.map((source) => source.id)).not.toContain('irrelevant-notes');
  });

  it('should reuse cached context for identical tasks', async () => {
    const manager = new AIContextManager({
      maxTokens: 4000,
      reservedTokens: 1000,
    });

    manager.registerSource(
      buildSource({
        id: 'domain-history',
        priority: 0.9,
        tags: ['history', 'domain:user'],
        getContent: async () => 'Previous domain decisions related to user entity evolution.',
      }),
    );

    const task = 'Assess historical decisions for user entity creation';

    const first = await manager.getOptimalContext(task);
    const second = await manager.getOptimalContext(task);

    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(second.content).toBe(first.content);
  });
});
