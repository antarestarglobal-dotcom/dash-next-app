import type { TemplateType } from "../validators/import";

const SHEET_NAME_MAP: Record<string, TemplateType> = {
  "📊 cohort": "cohort_hourly",
  cohort: "cohort_hourly",
  "data order": "order_detail",
  "master produk": "master_product",
  "master product": "master_product",
  sales: "sales_line_items",
  marketing: "marketing_costs",
  voucher: "marketing_costs",
  iklan: "marketing_costs",
  affiliate: "marketing_costs",
  sample: "marketing_costs",
  endorse: "marketing_costs",
  stok: "stock_snapshot",
  stock: "stock_snapshot",
  target: "sales_targets",
  "data-accel": "stock_snapshot",
  "data accel": "stock_snapshot",
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
  if (lower.includes("sales")) return "sales_line_items";
  if (["marketing", "voucher", "iklan", "affiliate", "sample", "endorse", "other cost"].some((name) => lower.includes(name))) return "marketing_costs";
  if (lower.includes("stok") || lower.includes("stock")) return "stock_snapshot";
  if (lower.includes("target")) return "sales_targets";
  if (lower.includes("data-accel") || lower.includes("data accel")) return "stock_snapshot";
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
    if (
      (joined.includes("tanggal") || joined.includes("date")) &&
      joined.includes("platform") && joined.includes("sku") &&
      (joined.includes("harga jual") || joined.includes("price"))
    )
      return "sales_line_items";
    if (
      (joined.includes("tanggal") || joined.includes("date")) &&
      (joined.includes("variable") || joined.includes("voucher type") || joined.includes("affiliate type") || joined.includes("metric type")) &&
      (joined.includes("total biaya") || joined.includes("total cost") || joined.includes("value") || joined.includes("sales value") || joined.includes("gmv value"))
    )
      return "marketing_costs";
    if (joined.includes("sku") && joined.includes("average out"))
      return "stock_snapshot";
    if (joined.includes("periode") && joined.includes("brand") && joined.includes("nominal"))
      return "sales_targets";
    if (joined.includes("tanggal") && joined.includes("net sales") && joined.includes("marketing cost") && joined.includes("net profit"))
      return "daily_performance";
  }
  return "unknown";
}
