/**
 * Error Handling Utilities
 *
 * Centralized error handling for all frameworks.
 */

import { ApiError } from './api-client';
import type { ApiErrorResponse } from './schemas';

type ErrorTrackingContext = {
  userId?: string;
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
} & Record<string, unknown>;

type TrackerPayload = {
  message: string;
  code?: string;
  stack?: string;
  details?: unknown;
  tags?: Record<string, string>;
  user?: { id?: string };
  extras?: Record<string, unknown>;
};

const TRACKING_ENV = process.env['NODE_ENV'] ?? 'production';
const TRACKING_DSN =
  process.env['NX_SENTRY_DSN'] ??
  process.env['NEXT_PUBLIC_SENTRY_DSN'] ??
  process.env['SENTRY_DSN'];

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
      const errorData = error.response as Partial<ApiErrorResponse> | undefined;
      const structuredError = errorData?.error;
      const message = structuredError?.message ?? error.message ?? 'Request failed';
      const code = structuredError?.code ?? (error.status ? String(error.status) : undefined);
      const details = structuredError?.details ?? errorData ?? null;

      return new AppError(message, code, details);
    } catch {
      const fallbackCode = error.status ? String(error.status) : undefined;
      return new AppError(error.message, fallbackCode);
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
export async function logError(error: unknown, context?: ErrorTrackingContext): Promise<void> {
  if (TRACKING_ENV !== 'production') {
    console.error('[Error]', error, context);
    return;
  }

  await sendToErrorTracker(error, context);
}

function buildTrackerPayload(error: unknown, context?: ErrorTrackingContext): TrackerPayload {
  const baseError = error instanceof AppError ? error : null;
  const nativeError = error instanceof Error ? error : null;

  const extras = { ...(context?.extras ?? {}) };
  const genericContext = { ...context };
  delete genericContext.userId;
  delete genericContext.tags;
  delete genericContext.extras;

  if (Object.keys(genericContext).length > 0) {
    Object.assign(extras, genericContext);
  }

  return {
    message: baseError?.message ?? nativeError?.message ?? 'Unknown error',
    code: baseError?.code,
    stack: nativeError?.stack,
    details: baseError?.details,
    tags: context?.tags,
    user: context?.userId ? { id: context.userId } : undefined,
    extras: Object.keys(extras).length ? extras : undefined,
  };
}

async function sendToErrorTracker(error: unknown, context?: ErrorTrackingContext): Promise<void> {
  if (!TRACKING_DSN || typeof fetch !== 'function') {
    return;
  }

  const payload = buildTrackerPayload(error, context);

  try {
    await fetch(TRACKING_DSN, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        environment: TRACKING_ENV,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch (trackerError) {
    console.warn('[ErrorTracking] Failed to deliver error payload', trackerError);
  }
}
