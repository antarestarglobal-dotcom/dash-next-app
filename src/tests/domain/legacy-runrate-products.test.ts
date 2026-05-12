import { describe, expect, it } from "vitest";
import { mapLegacyProductsToRunRateMetrics } from "@/lib/domain/legacy-runrate-products";
import { LEGACY_RUNRATE_SAMPLE } from "@/tests/fixtures/legacy-api";

describe("mapLegacyProductsToRunRateMetrics", () => {
  it("maps legacy products into run-rate product metrics", () => {
    const rows = mapLegacyProductsToRunRateMetrics(LEGACY_RUNRATE_SAMPLE);

    expect(rows.length).toBe(LEGACY_RUNRATE_SAMPLE.products.length);
    expect(rows[0]?.productName).toBe("JAKET MANUSELA");
    expect(rows[0]?.invoiceCount).toBe(3158);
    expect(rows[0]?.netSales).toBe(1193926886);
    expect(rows[0]?.klasifikasi).toBe("perlu_efisiensi");
  });

  it("normalizes duplicate product names to avoid conflicts", () => {
    const duplicated = {
      ...LEGACY_RUNRATE_SAMPLE,
      products: [
        ...LEGACY_RUNRATE_SAMPLE.products,
        {
          ...LEGACY_RUNRATE_SAMPLE.products[0],
          name: "jaket manusela",
        },
      ],
    };

    const rows = mapLegacyProductsToRunRateMetrics(duplicated);

    expect(rows.length).toBe(LEGACY_RUNRATE_SAMPLE.products.length);
    expect(rows.filter((row) => row.productName.toLowerCase() === "jaket manusela").length).toBe(1);
  });
});
