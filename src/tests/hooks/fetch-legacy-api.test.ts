import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { LegacyRunrateResponseSchema } from "@/lib/validators/run-rate";
import { fetchLegacyApi } from "@/hooks/use-legacy-api-query-utils";
import { LEGACY_RUNRATE_SAMPLE } from "@/tests/fixtures/legacy-api";

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("fetchLegacyApi", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed data for a valid legacy response", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(LEGACY_RUNRATE_SAMPLE));

    const data = await fetchLegacyApi("/api/runrate", LegacyRunrateResponseSchema);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/runrate$/),
      expect.objectContaining({ headers: { Accept: "application/json,*/*" } }),
    );
    expect(data.month).toBe("Mei-2026");
    expect(data.progress).toBe(35.48);
    expect(data.products[0]?.name).toBe("JAKET MANUSELA");
    expect(data.products[1]?.name).toBe("HAND WARMER ANTARESTAR");
  });

  it("throws NETWORK_ERROR when fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));

    await expect(fetchLegacyApi("/api/runrate", LegacyRunrateResponseSchema)).rejects.toMatchObject({
      name: "ApiError",
      code: "NETWORK_ERROR",
      status: 0,
    } satisfies Partial<ApiError>);
  });

  it("throws INVALID_RESPONSE when content-type is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>not json</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(fetchLegacyApi("/api/runrate", LegacyRunrateResponseSchema)).rejects.toMatchObject({
      name: "ApiError",
      code: "INVALID_RESPONSE",
      status: 200,
    } satisfies Partial<ApiError>);
  });

  it("throws INVALID_RESPONSE when JSON body cannot be parsed", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("{invalid", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchLegacyApi("/api/runrate", LegacyRunrateResponseSchema)).rejects.toMatchObject({
      name: "ApiError",
      code: "INVALID_RESPONSE",
      status: 200,
      message: "Respons API legacy tidak dapat dibaca",
    } satisfies Partial<ApiError>);
  });

  it("throws LEGACY_API_ERROR when response status is not OK", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ message: "forbidden" }, { status: 403 }));

    await expect(fetchLegacyApi("/api/runrate", LegacyRunrateResponseSchema)).rejects.toMatchObject({
      name: "ApiError",
      code: "LEGACY_API_ERROR",
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it("throws INVALID_RESPONSE when payload shape is wrong", async () => {
    const tinySchema = z.object({ success: z.literal(true), period: z.string() });
    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true, month: "2026-05" }));

    await expect(fetchLegacyApi("/api/funnel", tinySchema)).rejects.toMatchObject({
      name: "ApiError",
      code: "INVALID_RESPONSE",
      status: 200,
    } satisfies Partial<ApiError>);
  });
});
