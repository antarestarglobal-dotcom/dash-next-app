import { z } from "zod";
import {
  IMPORT_STATUS_VALUES,
  TEMPLATE_TYPE_VALUES,
  type ImportStatus as DomainImportStatus,
  type TemplateType as DomainTemplateType,
} from "@/lib/domain/import-domain";

export const ImportStatusSchema = z.enum(IMPORT_STATUS_VALUES);
export type ImportStatus = DomainImportStatus;

export const TemplateTypeSchema = z.enum(TEMPLATE_TYPE_VALUES);
export type TemplateType = DomainTemplateType;

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

export const ImportPreviewResponseSchema = z.array(ImportPreviewResultSchema);

const NullableDateTimeSchema = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.string().nullable(),
);

export const ImportListItemSchema = z.object({
  id: z.string().uuid(),
  sourceName: z.string(),
  sheetName: z.string().nullable(),
  templateType: TemplateTypeSchema,
  period: z.string().nullable(),
  brand: z.string().nullable(),
  platform: z.string().nullable(),
  channel: z.string().nullable(),
  metric: z.string().nullable(),
  status: ImportStatusSchema,
  errorMessage: z.string().nullable(),
  createdAt: NullableDateTimeSchema,
  importedAt: NullableDateTimeSchema,
});

export const ImportListResponseSchema = z.array(ImportListItemSchema);

export const ImportDetailSchema = ImportListItemSchema.extend({
  detectedJson: z.unknown(),
  warningJson: z.unknown().nullable(),
  rejectedRowsJson: z.unknown().nullable(),
});

export const ImportDetailResponseSchema = ImportDetailSchema;

export const ConfirmImportResponseSchema = z.object({
  message: z.string(),
});

export type CohortMetadata = z.infer<typeof CohortMetadataSchema>;
export type CohortDailyRow = z.infer<typeof CohortDailyRowSchema>;
export type HostGmvRow = z.infer<typeof HostGmvRowSchema>;
export type OrderDetailRow = z.infer<typeof OrderDetailRowSchema>;
export type ProductRow = z.infer<typeof ProductRowSchema>;
export type BundleRow = z.infer<typeof BundleRowSchema>;
export type HostOkrRow = z.infer<typeof HostOkrRowSchema>;
export type ImportPreviewResult = z.infer<typeof ImportPreviewResultSchema>;
export type ImportListItem = z.infer<typeof ImportListItemSchema>;
export type ImportDetail = z.infer<typeof ImportDetailSchema>;
