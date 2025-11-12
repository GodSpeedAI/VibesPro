/**
 * TypeScript client for Temporal AI Pattern Recommendation Engine
 *
 * Provides a high-level interface to the Rust-based semantic pattern search system.
 * Communicates with the Rust CLI binary for now, with plans for NAPI bindings later.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execFileAsync = promisify(execFile);

// Schema definitions
const PatternSchema = z.object({
  id: z.string(),
  description: z.string(),
  filePaths: z.array(z.string()),
  commitSha: z.string(),
  timestamp: z.number(),
  tags: z.array(z.string()),
});

export type Pattern = z.infer<typeof PatternSchema>;
const RecommendationSchema = z.object({
  pattern: PatternSchema,
  similarityScore: z.number(),
  recencyScore: z.number(),
  usageScore: z.number(),
  finalScore: z.number(),
  explanation: z.string(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export interface TemporalAIOptions {
  /** Path to the temporal-ai CLI binary */
  binaryPath?: string;
  /** Path to the database file */
  dbPath?: string;
}

/**
 * Client for interacting with the Temporal AI pattern search system
 */
export class TemporalAIClient {
  private binaryPath: string;

  constructor(options: TemporalAIOptions = {}) {
    this.binaryPath = options.binaryPath ?? 'crates/temporal-ai/target/release/temporal-ai';
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    try {
      await execFileAsync(this.binaryPath, ['init']);
    } catch (error) {
      throw new Error(`Failed to initialize database: ${error}`);
    }
  }

  /**
   * Refresh pattern database from Git history
   * @param commitCount Number of recent commits to process
   */
  async refreshPatterns(commitCount: number = 1000): Promise<void> {
    try {
      await execFileAsync(this.binaryPath, ['refresh', '--commits', commitCount.toString()]);
    } catch (error) {
      throw new Error(`Failed to refresh patterns: ${error}`);
    }
  }

  /**
   * Get pattern recommendations for a query
   * @param query Description of the task or pattern you're looking for
   * @param topK Number of recommendations to return (default: 5)
   */
  async recommend(query: string, topK: number = 5): Promise<Recommendation[]> {
    try {
      const { stdout } = await execFileAsync(this.binaryPath, [
        'query',
        query,
        '--top',
        topK.toString(),
      ]);

      // Parse the output
      // Note: This is a simplified parser for the CLI output
      // In production, we'd want JSON output from the CLI
      return this.parseRecommendations(stdout);
    } catch (error) {
      throw new Error(`Failed to get recommendations: ${error}`);
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalPatterns: number;
    databaseSize: number;
  }> {
    try {
      const { stdout } = await execFileAsync(this.binaryPath, ['stats']);

      // Parse output like:
      // Total patterns: 87
      // Database size: 304500 bytes (0.30 MB)
      const patternsMatch = stdout.match(/Total patterns: (\d+)/);
      const sizeMatch = stdout.match(/Database size: (\d+) bytes/);

      return {
        totalPatterns: patternsMatch?.[1] ? parseInt(patternsMatch[1], 10) : 0,
        databaseSize: sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) : 0,
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error}`);
    }
  }

  /**
   * Parse recommendations from CLI output
   * This is a temporary implementation until we add JSON output to the CLI
   */
  private parseRecommendations(output: string): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const lines = output.split('\n');

    let currentRec: Partial<Recommendation> | null = null;

    for (const line of lines) {
      // Parse line like: "1. [Score: 0.249] Pattern from f12ed69 (docs): add Python/FastAPI..."
      const scoreMatch = line.match(/\[Score: ([\d.]+)\] Pattern from (\w+) \(([\w,\s]+)\): (.+)/);
      if (scoreMatch) {
        if (currentRec) {
          // Save previous recommendation
          const parsed = RecommendationSchema.safeParse(currentRec);
          if (parsed.success) {
            recommendations.push(parsed.data);
          }
        }

        const [, scoreStr, commitSha, tags, description] = scoreMatch;
        const score = scoreStr ?? '0';
        const sha = commitSha ?? 'unknown';
        const tagStr = tags ?? '';
        const desc = description ?? '';
        currentRec = {
          finalScore: parseFloat(score),
          pattern: {
            id: sha,
            description: desc.replace(/ - Similarity:.*$/, ''),
            filePaths: [],
            commitSha: sha,
            timestamp: Date.now() / 1000, // placeholder
            tags: tagStr.split(',').map((t) => t.trim()),
          },
          similarityScore: 0,
          recencyScore: 0,
          usageScore: 0,
          explanation: line,
        };
      }

      // Parse files line: "   Files: docs/dev_adr.md, docs/dev_sds.md"
      const filesMatch = line.match(/Files: (.+)/);
      if (filesMatch?.[1] && currentRec?.pattern) {
        currentRec.pattern.filePaths = filesMatch[1].split(',').map((f) => f.trim());
      }

      // Parse commit line: "   Commit: f12ed6914214c3999e78720ddbfa1bf230daa1a1"
      const commitMatch = line.match(/Commit: (\w+)/);
      if (commitMatch?.[1] && currentRec?.pattern) {
        currentRec.pattern.commitSha = commitMatch[1];
      }
    }

    if (currentRec) {
      const parsed = RecommendationSchema.safeParse(currentRec);
      if (parsed.success) {
        recommendations.push(parsed.data);
      }
    }

    return recommendations;
  }
}

/**
 * Helper function to get recommendations quickly
 */
export async function getRecommendations(
  query: string,
  options: TemporalAIOptions & { topK?: number } = {},
): Promise<Recommendation[]> {
  const client = new TemporalAIClient(options);
  return client.recommend(query, options.topK);
}
