/**
 * Environment Configuration
 *
 * Framework-agnostic environment variable access.
 * Supports Next.js, Remix, and Expo environments.
 *
 * @see DEV-SDS-028 - Shared assets strategy
 */

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, fallback?: string): string {
  // Next.js (NEXT_PUBLIC_*)
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`];
    if (value !== undefined) return value;
  }

  // Browser (import.meta.env for Vite/Remix)
  if (typeof import.meta !== 'undefined') {
    const meta = import.meta as { env?: Record<string, string | undefined> };
    if (meta.env) {
      const value = meta.env[key];
      if (value !== undefined) return value;
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Environment variable ${key} is not set`);
}

const nodeEnv = getEnv('NODE_ENV', 'development');

export const env = {
  API_URL: getEnv('API_URL', 'http://localhost:8000'),
  SUPABASE_URL: getEnv('SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY', ''),
  NODE_ENV: getEnv('NODE_ENV', 'development'),

  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
} as const;

export type Env = typeof env;
