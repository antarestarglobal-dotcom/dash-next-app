import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-client";
import { reportLegacyApiError } from "@/lib/telemetry/legacy-api";

describe("reportLegacyApiError", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("does not log in production", () => {
    process.env.NODE_ENV = "production";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    reportLegacyApiError("runrate", new ApiError("LEGACY_API_ERROR", "HTTP 403", 403));

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("logs normalized ApiError metadata in non-production", () => {
    process.env.NODE_ENV = "development";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    reportLegacyApiError("funnel", new ApiError("INVALID_RESPONSE", "bad payload", 200), {
      errorUpdatedAt: 123,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[legacy-api] request failed",
      expect.objectContaining({
        source: "funnel",
        proxyPath: "/legacy-api",
        code: "INVALID_RESPONSE",
        status: 200,
        message: "bad payload",
        errorUpdatedAt: 123,
      }),
    );
  });

  it("logs fallback metadata for non-Error values", () => {
    process.env.NODE_ENV = "development";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    reportLegacyApiError("runrate", "timeout");

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[legacy-api] request failed",
      expect.objectContaining({
        source: "runrate",
        proxyPath: "/legacy-api",
        message: "timeout",
      }),
    );
  });
});
