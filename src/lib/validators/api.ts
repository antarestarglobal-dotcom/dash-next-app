import { z } from "zod";

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export function apiSuccess<T>(data: T) {
  return { success: true as const, data };
}

export function apiError(code: string, message: string, details?: Record<string, unknown>) {
  return {
    success: false as const,
    error: { code, message, ...(details ? { details } : {}) },
  };
}
