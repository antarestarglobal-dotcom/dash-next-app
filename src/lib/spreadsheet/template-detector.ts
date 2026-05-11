import type { TemplateType } from "../validators/import";

const SHEET_NAME_MAP: Record<string, TemplateType> = {
  "📊 cohort": "cohort_hourly",
  cohort: "cohort_hourly",
  "data order": "order_detail",
  "master produk": "master_product",
  "master product": "master_product",
};

const GMV_HOST_PATTERN = /^gmv host/i;
const OKR_HOST_PATTERN = /^okr host/i;
const PIVOT_PATTERN = /^pivot/i;

export function detectTemplateBySheetName(sheetName: string): TemplateType {
  const lower = sheetName.toLowerCase().trim();

  if (SHEET_NAME_MAP[lower]) return SHEET_NAME_MAP[lower];
  if (GMV_HOST_PATTERN.test(sheetName)) return "host_gmv";
  if (OKR_HOST_PATTERN.test(sheetName)) return "host_okr";
  if (PIVOT_PATTERN.test(sheetName)) return "unknown";

  // Partial matches
  if (lower.includes("cohort")) return "cohort_hourly";
  if (lower.includes("order")) return "order_detail";
  if (lower.includes("master")) return "master_product";
  if (lower.includes("gmv")) return "host_gmv";
  if (lower.includes("okr")) return "host_okr";

  return "unknown";
}

export function detectTemplateByHeaderScan(rows: unknown[][]): TemplateType {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map((c) => String(c ?? "").trim().toLowerCase());
    const joined = cells.join(" ");

    if (cells.includes("hari") && cells.includes("total") && joined.includes("tanggal"))
      return "cohort_hourly";
    if (joined.includes("host") && joined.includes("shift") && joined.includes("gmv"))
      return "host_gmv";
    if (joined.includes("host") && joined.includes("shift") && (joined.includes("ctr") || joined.includes("aov")))
      return "host_okr";
    if (joined.includes("invoice") && joined.includes("net sales"))
      return "order_detail";
    if (joined.includes("sku induk") || joined.includes("sku varian"))
      return "master_product";
  }
  return "unknown";
}
