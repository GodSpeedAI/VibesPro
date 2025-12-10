/**
 * Integration tests for Temporal AI Client
 *
 * Note: These tests require the temporal-ai Rust binary to be built.
 * They are skipped in CI environments where the binary isn't available.
 */

// Jest globals (beforeAll, describe, expect, it) are available automatically
import { existsSync } from 'node:fs';
import { TemporalAIClient, getRecommendations } from './temporal-ai-client.js';

const BINARY_PATH = 'crates/temporal-ai/target/release/temporal-ai';
const hasBinary = existsSync(BINARY_PATH);
const describeWithBinary = hasBinary ? describe : describe.skip;

describeWithBinary('TemporalAIClient', () => {
  let client: TemporalAIClient;

  beforeAll(() => {
    client = new TemporalAIClient();
  });

  it('should get database statistics', async () => {
    const stats = await client.getStats();

    expect(stats).toBeDefined();
    expect(stats.totalPatterns).toBeGreaterThanOrEqual(0);
    expect(stats.databaseSize).toBeGreaterThanOrEqual(0);
  }, 30000);

  it('should get recommendations for a query', async () => {
    const query = 'Add authentication middleware';
    const recommendations = await client.recommend(query, 3);

    expect(Array.isArray(recommendations)).toBe(true);

    if (recommendations.length > 0) {
      const first = recommendations[0];
      expect(first).toBeDefined();
      expect(first?.pattern).toBeDefined();
      expect(first?.finalScore).toBeDefined();
      expect(first?.pattern?.description).toBeDefined();
      expect(first?.pattern?.commitSha).toBeDefined();
    }
  }, 30000);

  it('should work with helper function', async () => {
    const recommendations = await getRecommendations('FastAPI endpoint', { topK: 2 });

    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeLessThanOrEqual(2);
  }, 30000);
});

describeWithBinary('TemporalAIClient - E2E', () => {
  it('should refresh and query end-to-end', async () => {
    const client = new TemporalAIClient();

    // Refresh with small set
    await client.refreshPatterns(50);

    // Get stats
    const stats = await client.getStats();
    expect(stats.totalPatterns).toBeGreaterThan(0);

    // Query
    const recs = await client.recommend('database migration', 3);
    expect(Array.isArray(recs)).toBe(true);
  }, 60000);
});
