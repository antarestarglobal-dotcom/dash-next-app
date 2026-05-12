export const IMPORT_STATUS_VALUES = ["preview", "imported", "failed"] as const;

export const TEMPLATE_TYPE_VALUES = [
  "cohort_hourly",
  "host_gmv",
  "order_detail",
  "master_product",
  "host_okr",
  "sales_line_items",
  "marketing_costs",
  "stock_snapshot",
  "sales_targets",
  "daily_performance",
  "unknown",
] as const;

export type ImportStatus = (typeof IMPORT_STATUS_VALUES)[number];
export type TemplateType = (typeof TEMPLATE_TYPE_VALUES)[number];
export type ParsedTemplateType = Exclude<TemplateType, "unknown">;
