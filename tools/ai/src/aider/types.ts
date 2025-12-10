/**
 * Aider CLI integration types
 */

export type AiderBackend = 'openai' | 'openrouter' | 'ollama';

export interface AiderConfig {
  /** Enable Aider integration */
  enabled: boolean;
  /** Fallback order for backends (default: ['openai', 'openrouter', 'ollama']) */
  fallbackOrder?: AiderBackend[];
  /** Model to use (e.g., 'gpt-4o', 'anthropic/claude-3.5-sonnet', 'qwen2.5-coder') */
  model?: string;
  /** Override OPENAI_API_BASE for custom endpoints */
  apiBase?: string;
  /** Priority for the Aider context source (default: 0.85) */
  priority?: number;
  /** Tags for relevance matching */
  tags?: string[];
}

export interface AiderBackendConfig {
  backend: AiderBackend;
  model: string;
  envVars: Record<string, string>;
}

/**
 * Default fallback order: OpenAI → OpenRouter → Ollama
 */
export const DEFAULT_FALLBACK_ORDER: AiderBackend[] = ['openai', 'openrouter', 'ollama'];

/**
 * Default models for each backend
 */
export const DEFAULT_MODELS: Record<AiderBackend, string> = {
  openai: 'gpt-4o',
  openrouter: 'openrouter/anthropic/claude-3.5-sonnet',
  ollama: 'ollama_chat/qwen2.5-coder',
};
