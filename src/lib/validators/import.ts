import { z } from "zod";

export const ImportStatusSchema = z.enum(["preview", "imported", "failed"]);
export type ImportStatus = z.infer<typeof ImportStatusSchema>;

export const TemplateTypeSchema = z.enum([
  "cohort_hourly",
  "host_gmv",
  "order_detail",
  "master_product",
  "host_okr",
  "unknown",
]);
export type TemplateType = z.infer<typeof TemplateTypeSchema>;

export const CohortMetadataSchema = z.object({
  period: z.string(),
  metric: z.string(),
  platform: z.string(),
  brand: z.string(),
  channel: z.string(),
});

export const CohortDailyRowSchema = z.object({
  date: z.string(),
  dayName: z.string(),
  total: z.number().nullable(),
  contributionPercent: z.number().nullable(),
  hours: z.array(
    z.object({
      hour: z.number().int().min(0).max(23),
      valuePercent: z.number().nullable(),
    }),
  ),
});

export const HostGmvRowSchema = z.object({
  host: z.string(),
  date: z.string(),
  platform: z.string(),
  shift: z.string(),
  gmv: z.number().nullable(),
});

export const OrderDetailRowSchema = z.object({
  orderDate: z.string(),
  orderTime: z.string().nullable(),
  brand: z.string().nullable(),
  platform: z.string().nullable(),
  invoice: z.string(),
  netSales: z.number().nullable(),
  sku: z.string().nullable(),
  quantity: z.number().int().nullable(),
});

export const ProductRowSchema = z.object({
  category: z.string().nullable(),
  productName: z.string(),
  parentSku: z.string().nullable(),
  variantName: z.string().nullable(),
  variantSku: z.string(),
  hpp: z.number().nullable(),
  sellingPrice: z.number().nullable(),
});

export const BundleRowSchema = z.object({
  bundleName: z.string(),
  bundleCode: z.string(),
  items: z.array(
    z.object({
      productName: z.string(),
      quantity: z.number().int(),
    }),
  ),
});

export const HostOkrRowSchema = z.object({
  host: z.string(),
  date: z.string(),
  platform: z.string(),
  shift: z.string(),
  ctr: z.number().nullable(),
  aov: z.number().nullable(),
});

export const ConfirmImportRequestSchema = z.object({
  importId: z.string().uuid("Invalid import ID"),
});

export const ImportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ImportStatusSchema.optional(),
  templateType: TemplateTypeSchema.optional(),
});

export const ImportPreviewResultSchema = z.object({
  importId: z.string().uuid(),
  sourceName: z.string(),
  sheetName: z.string(),
  templateType: TemplateTypeSchema,
  period: z.string().nullable(),
  metric: z.string().nullable(),
  platform: z.string().nullable(),
  brand: z.string().nullable(),
  channel: z.string().nullable(),
  validRows: z.number(),
  rejectedRowsCount: z.number(),
  warnings: z.array(z.string()),
  previewRows: z.array(z.record(z.unknown())),
  hasFatalError: z.boolean(),
  errorMessage: z.string().nullable(),
});

export type CohortMetadata = z.infer<typeof CohortMetadataSchema>;
export type CohortDailyRow = z.infer<typeof CohortDailyRowSchema>;
export type HostGmvRow = z.infer<typeof HostGmvRowSchema>;
export type OrderDetailRow = z.infer<typeof OrderDetailRowSchema>;
export type ProductRow = z.infer<typeof ProductRowSchema>;
export type BundleRow = z.infer<typeof BundleRowSchema>;
export type HostOkrRow = z.infer<typeof HostOkrRowSchema>;
export type ImportPreviewResult = z.infer<typeof ImportPreviewResultSchema>;
