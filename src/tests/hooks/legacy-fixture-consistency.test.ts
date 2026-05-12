import { describe, expect, it } from "vitest";
import { LegacyFunnelResponseSchema, LegacyRunrateResponseSchema } from "@/lib/validators/run-rate";
import { LEGACY_FUNNEL_SAMPLE, LEGACY_RUNRATE_SAMPLE } from "@/tests/fixtures/legacy-api";

describe("legacy fixture consistency", () => {
  it("matches current runrate and funnel schema", () => {
    expect(LegacyRunrateResponseSchema.parse(LEGACY_RUNRATE_SAMPLE).success).toBe(true);
    expect(LegacyFunnelResponseSchema.parse(LEGACY_FUNNEL_SAMPLE).success).toBe(true);
  });

  it("has no duplicate product names in each payload", () => {
    const runrateNames = LEGACY_RUNRATE_SAMPLE.products.map((p) => p.name);
    const funnelNames = LEGACY_FUNNEL_SAMPLE.funnelProduk.map((p) => p.name);

    expect(new Set(runrateNames).size).toBe(runrateNames.length);
    expect(new Set(funnelNames).size).toBe(funnelNames.length);
  });

  it("keeps funnel products aligned with runrate products", () => {
    const runrateSet = new Set(LEGACY_RUNRATE_SAMPLE.products.map((p) => p.name));
    for (const product of LEGACY_FUNNEL_SAMPLE.funnelProduk) {
      expect(runrateSet.has(product.name)).toBe(true);
    }
  });
});
