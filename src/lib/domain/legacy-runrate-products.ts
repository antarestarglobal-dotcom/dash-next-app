import type { ProductMetric } from "@/lib/validators/run-rate";
import type { LegacyRunrateResponse } from "@/lib/validators/run-rate";

function mapLegacyClass(cls: string): ProductMetric["klasifikasi"] {
  if (cls === "bintang") return "bintang";
  if (cls === "potensial") return "potensial";
  if (cls === "bermasalah") return "bermasalah";
  return "perlu_efisiensi";
}

export function mapLegacyProductsToRunRateMetrics(
  response: Omit<LegacyRunrateResponse, "products"> & { products: readonly LegacyRunrateResponse["products"][number][] },
): ProductMetric[] {
  const seen = new Set<string>();

  return response.products
    .filter((product) => {
      const key = product.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((product, index) => ({
      productId: index + 1,
      productName: product.name,
      invoiceCount: Math.max(0, Math.round(product.units)),
      netSales: product.gross,
      margin: product.margin,
      aov: product.aov,
      npm: product.npm,
      contributionSales: product.contribSales,
      contributionProfit: product.contribProfit,
      klasifikasi: mapLegacyClass(product.cls),
      stok: null,
      estimasiHabisHari: null,
    }));
}
