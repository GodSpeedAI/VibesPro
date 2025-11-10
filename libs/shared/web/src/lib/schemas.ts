/**
 * Shared Validation Schemas
 *
 * Zod schemas for type-safe data validation across all frameworks.
 * These will integrate with Supabase-generated types in PHASE-004.
 *
 * @see DEV-SDS-028 - Shared assets strategy
 */

import { z } from 'zod';

// Base primitive schemas
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const TimestampSchema = z.string().datetime();
export const UrlSchema = z.string().url();

// Common domain schemas
export const UserSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export type User = z.infer<typeof UserSchema>;

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().nonnegative().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// API response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z
      .object({
        pagination: PaginationSchema.optional(),
      })
      .optional(),
  });

// Error response schema
export const ApiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;

/**
 * Validation helper functions
 */
export const validate = {
  user: (data: unknown): User => UserSchema.parse(data),
  pagination: (data: unknown): Pagination => PaginationSchema.parse(data),
};

/**
 * Safe parse helpers that return { success, data, error }
 */
export const safeParse = {
  user: (data: unknown) => UserSchema.safeParse(data),
  pagination: (data: unknown) => PaginationSchema.safeParse(data),
};
