# Temporal AI Port

This port defines the contract for interacting with the Temporal AI system.

## Interface

```typescript
interface TemporalAI {
  /**
   * Initialize the temporal database structure and default schemas.
   * @param projectName Name of the project for metadata.
   * @param dbPath Optional custom path for the database file.
   */
  init(projectName: string, dbPath?: string): Promise<InitResult>;

  /**
   * Get the current status of the system, including DB stats and model availability.
   */
  status(): Promise<StatusReport>;

  /**
   * Embed text or a file into the vector store.
   * @param input Text content or file path to embed.
   * @param model Optional model name (default: gemma-300m).
   */
  embed(input: string | FilePath, model?: string): Promise<EmbedResult>;

  /**
   * Perform a semantic search query against the knowledge base.
   * @param query The search text.
   * @param limit Max number of results (default: 5).
   */
  query(query: string, limit?: number): Promise<QueryResult[]>;
}

interface InitResult {
  success: boolean;
  dbPath: string;
  specsCreated: number;
}

interface StatusReport {
  dbConnected: boolean;
  patternCount: number;
  decisionCount: number;
  modelLoaded: boolean;
}

interface EmbedResult {
  vectorId: string;
  dimensions: number;
  tokenCount: number;
}

interface QueryResult {
  score: number;
  content: string;
  metadata: Record<string, any>;
}
```
