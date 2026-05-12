import { ApiError } from "@/lib/api-client";

type LegacySource = "runrate" | "funnel";

const LEGACY_API_PROXY_PREFIX = "/legacy-api";

export function reportLegacyApiError(
  source: LegacySource,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === "production") return;

  if (error instanceof ApiError) {
    console.warn("[legacy-api] request failed", {
      source,
      proxyPath: LEGACY_API_PROXY_PREFIX,
      code: error.code,
      status: error.status,
      message: error.message,
      details: error.details,
      ...context,
    });
    return;
  }

  console.warn("[legacy-api] request failed", {
    source,
    proxyPath: LEGACY_API_PROXY_PREFIX,
    message: error instanceof Error ? error.message : String(error),
    ...context,
  });
}
