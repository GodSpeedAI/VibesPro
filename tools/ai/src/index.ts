export { AIContextManager } from './context-manager.js';
export type {
  AIContextManagerConfig,
  ContextSelectionResult,
  ContextSource,
  ContextSourceMetrics,
} from './context-manager.js';

// Aider integration
export {
  AiderContextSource,
  DEFAULT_FALLBACK_ORDER,
  DEFAULT_MODELS,
  isAiderConfigured,
} from './aider/index.js';
export type { AiderBackend, AiderConfig } from './aider/index.js';
