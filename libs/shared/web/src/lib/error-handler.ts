/**
 * Error Handling Utilities
 *
 * Centralized error handling for all frameworks.
 */

import { ApiError } from './api-client';
import type { ApiErrorResponse } from './schemas';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Convert API errors to user-friendly messages
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof ApiError) {
    // Try to parse structured error response
    try {
      const errorData = error.response as ApiErrorResponse;
      return new AppError(errorData.error.message, errorData.error.code, errorData.error.details);
    } catch {
      return new AppError(error.message, error.status.toString());
    }
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unknown error occurred');
}

/**
 * Log error to console (development) or error tracking service (production)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env['NODE_ENV'] === 'development') {
    console.error('[Error]', error, context);
  } else {
    // In production, send to error tracking service (Sentry, etc.)
    // TODO: Integrate with error tracking service
  }
}
