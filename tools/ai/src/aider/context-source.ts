/**
 * Aider-based context source
 *
 * Implements ContextSource by calling the aider CLI to get codebase context.
 * Supports multiple backends with automatic fallback.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

import type { ContextSource } from '../context-manager.js';

import type { AiderBackend, AiderBackendConfig, AiderConfig } from './types.js';
import { DEFAULT_FALLBACK_ORDER, DEFAULT_MODELS } from './types.js';

const execFileAsync = promisify(execFile);

/**
 * Check if a command exists on the system
 */
async function commandExists(command: string): Promise<boolean> {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execFileAsync(cmd, [command]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build backend configuration based on available environment variables
 */
function buildBackendConfig(backend: AiderBackend, config: AiderConfig): AiderBackendConfig | null {
  const envVars: Record<string, string> = {};

  switch (backend) {
    case 'openai': {
      const apiKey = process.env['OPENAI_API_KEY'];
      if (!apiKey) return null;

      envVars['OPENAI_API_KEY'] = apiKey;

      // Support custom API base (GitHub Copilot, LiteLLM, etc.)
      const apiBase = config.apiBase ?? process.env['OPENAI_API_BASE'];
      if (apiBase) {
        envVars['OPENAI_API_BASE'] = apiBase;
      }

      const model = config.model ?? process.env['AIDER_MODEL'] ?? DEFAULT_MODELS.openai;

      const defaultBase = 'https://api.openai.com/v1';
      const isCustomBase =
        apiBase && apiBase !== defaultBase && !apiBase.startsWith('https://api.openai.com');

      // Prefix with openai/ if using custom base and model doesn't have prefix
      const finalModel = isCustomBase && !model.includes('/') ? `openai/${model}` : model;

      return { backend, model: finalModel, envVars };
    }

    case 'openrouter': {
      const apiKey = process.env['OPENROUTER_API_KEY'];
      if (!apiKey) return null;

      envVars['OPENROUTER_API_KEY'] = apiKey;

      const model = config.model ?? process.env['AIDER_MODEL'] ?? DEFAULT_MODELS.openrouter;
      // Ensure openrouter/ prefix
      const finalModel = model.startsWith('openrouter/') ? model : `openrouter/${model}`;

      return { backend, model: finalModel, envVars };
    }

    case 'ollama': {
      // Ollama doesn't require API key for local usage
      const apiBase = process.env['OLLAMA_API_BASE'] ?? 'http://localhost:11434';
      envVars['OLLAMA_API_BASE'] = apiBase;

      const model = config.model ?? process.env['AIDER_MODEL'] ?? DEFAULT_MODELS.ollama;
      // Ensure ollama_chat/ prefix
      const lowerModel = model.trim().toLowerCase();
      const finalModel = lowerModel.startsWith('ollama_chat/') ? model : `ollama_chat/${model}`;

      return { backend, model: finalModel, envVars };
    }

    default:
      return null;
  }
}

/**
 * AiderContextSource - integrates Aider CLI as a context source
 */
export class AiderContextSource implements ContextSource {
  readonly id = 'aider:codebase';
  readonly priority: number;
  readonly tags: readonly string[];
  readonly lastUpdated = new Date();
  readonly successRate = 0.8;
  readonly patternConfidence = 0.75;
  readonly provenance = 'aider-cli';

  private readonly config: AiderConfig;
  private readonly fallbackOrder: AiderBackend[];
  private cachedAvailability: boolean | null = null;
  private lastContent: string = '';

  constructor(config: AiderConfig) {
    this.config = config;
    this.priority = config.priority ?? 0.85;
    this.tags = config.tags ?? ['aider', 'codebase', 'llm'];
    this.fallbackOrder = config.fallbackOrder ?? DEFAULT_FALLBACK_ORDER;
  }

  /**
   * Check if aider CLI is available
   */
  async isAvailable(): Promise<boolean> {
    if (this.cachedAvailability !== null) {
      return this.cachedAvailability;
    }

    this.cachedAvailability = await commandExists('aider');
    return this.cachedAvailability;
  }

  /**
   * Find the first available backend in fallback order
   */
  private findAvailableBackend(): AiderBackendConfig | null {
    for (const backend of this.fallbackOrder) {
      const backendConfig = buildBackendConfig(backend, this.config);
      if (backendConfig) {
        return backendConfig;
      }
    }
    return null;
  }

  /**
   * Get content from Aider CLI
   */
  async getContent(): Promise<string> {
    // Check if aider is available
    if (!(await this.isAvailable())) {
      console.warn('[AiderContextSource] aider CLI not found, skipping');
      return '';
    }

    // Find available backend
    const backendConfig = this.findAvailableBackend();
    if (!backendConfig) {
      console.warn('[AiderContextSource] No backend configured (missing API keys)');
      return '';
    }

    // Return cached content if available
    if (this.lastContent) {
      return this.lastContent;
    }

    try {
      // Build aider command
      // Note: We use --message to ask aider about the codebase structure
      // --yes-always and --no-git prevent interactive prompts
      const args = [
        '--model',
        backendConfig.model,
        '--message',
        'Provide a brief summary of the project structure and key patterns.',
        '--yes-always',
        '--no-git',
        '--no-auto-commits',
      ];

      const env = {
        ...process.env,
        ...backendConfig.envVars,
      };

      const { stdout } = await execFileAsync('aider', args, {
        env,
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB
      });

      this.lastContent = stdout.trim();
      return this.lastContent;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[AiderContextSource] Failed to get context: ${message}`);
      return '';
    }
  }
}

/**
 * Check if Aider integration is properly configured
 */
export async function isAiderConfigured(config: AiderConfig): Promise<{
  available: boolean;
  backend: AiderBackend | null;
  reason: string;
}> {
  const source = new AiderContextSource(config);

  if (!(await source.isAvailable())) {
    return {
      available: false,
      backend: null,
      reason: 'aider CLI not found. Install with: pip install aider-chat',
    };
  }

  const backendConfig = source['findAvailableBackend']();
  if (!backendConfig) {
    return {
      available: false,
      backend: null,
      reason:
        'No backend configured. Set one of: OPENAI_API_KEY, OPENROUTER_API_KEY, or start Ollama.',
    };
  }

  return {
    available: true,
    backend: backendConfig.backend,
    reason: `Using ${backendConfig.backend} backend with model ${backendConfig.model}`,
  };
}
