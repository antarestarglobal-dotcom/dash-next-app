"use client";

import { ApiError } from "@/lib/api-client";
import type { z } from "zod";

const LEGACY_API_PROXY_PREFIX = "/legacy-api";

function buildLegacyUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${LEGACY_API_PROXY_PREFIX}${normalizedPath}`;
}

export async function fetchLegacyApi<TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  let res: Response;

  try {
    res = await fetch(buildLegacyUrl(path), {
      headers: { Accept: "application/json,*/*" },
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Gagal menghubungi API legacy", 0);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError("INVALID_RESPONSE", "Respons API legacy bukan JSON", res.status);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError("INVALID_RESPONSE", "Respons API legacy tidak dapat dibaca", res.status);
  }

  if (!res.ok) {
    throw new ApiError(
      "LEGACY_API_ERROR",
      `API legacy mengembalikan HTTP ${res.status}`,
      res.status,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError("INVALID_RESPONSE", "Format respons API legacy tidak dikenali", res.status, {
      issues: parsed.error.flatten(),
    });
  }

  return parsed.data;
}
