import { z } from "zod";

export const PeriodSchema = z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM");
export const PositiveIntSchema = z.coerce.number().int().positive();
export const NonNegativeNumberSchema = z.coerce.number().nonnegative();
export const PercentageSchema = z.coerce.number();
export const KlasifikasiSchema = z.enum([
  "bintang",
  "potensial",
  "perlu_efisiensi",
  "bermasalah",
]);
export const MarketingChannelSchema = z.enum([
  "voucher",
  "affiliate",
  "sample",
  "endorse",
  "iklan",
  "other",
]);

export const RunRateFilterSchema = z.object({
  period: PeriodSchema.optional(),
  storeId: PositiveIntSchema.optional(),
  brandId: PositiveIntSchema.optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const ProductFilterSchema = RunRateFilterSchema.extend({
  klasifikasi: KlasifikasiSchema.optional(),
  sortBy: z.enum(["netSales", "netProfit", "npm", "contributionSales"]).default("netSales"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const MarketingFilterSchema = RunRateFilterSchema.extend({
  variable: MarketingChannelSchema.optional(),
});

export const StockFilterSchema = z.object({
  snapshotDate: z.string().date().optional(),
  kategori: z.string().min(1).optional(),
  sortBy: z.enum(["limit_0_days", "total_qty", "average_out"]).default("limit_0_days"),
  minDays: NonNegativeNumberSchema.optional(),
  maxDays: NonNegativeNumberSchema.optional(),
});

export const MoMFilterSchema = z.object({
  months: z.array(PeriodSchema).min(1),
  storeId: PositiveIntSchema.optional(),
});

export const SummaryResponseSchema = z.object({
  netSales: NonNegativeNumberSchema,
  netProfit: z.number(),
  npm: PercentageSchema,
  margin: PercentageSchema,
  marketingCost: NonNegativeNumberSchema,
  marketingRatio: PercentageSchema,
  gmv: NonNegativeNumberSchema,
  progressHari: z.number().min(0).max(100),
  vsLastMonth: z.object({
    netSales: PercentageSchema,
    netProfit: PercentageSchema,
    npm: PercentageSchema,
  }),
});

export const DailyMetricSchema = z.object({
  date: z.string().date(),
  netSales: NonNegativeNumberSchema,
  netProfit: z.number(),
  npm: PercentageSchema,
  marketingCost: NonNegativeNumberSchema,
  gmv: NonNegativeNumberSchema,
  liveGmv: NonNegativeNumberSchema,
});

export const ProductMetricSchema = z.object({
  productId: PositiveIntSchema,
  productName: z.string().min(1),
  invoiceCount: z.number().int().nonnegative(),
  netSales: NonNegativeNumberSchema,
  margin: z.number(),
  aov: NonNegativeNumberSchema,
  npm: PercentageSchema,
  contributionSales: PercentageSchema,
  contributionProfit: PercentageSchema,
  klasifikasi: KlasifikasiSchema,
  stok: z.number().int().nullable(),
  estimasiHabisHari: z.number().nullable(),
});

export const MarketingResponseSchema = z.object({
  total: NonNegativeNumberSchema,
  byChannel: z.object({
    voucher: NonNegativeNumberSchema,
    affiliate: NonNegativeNumberSchema,
    sample: NonNegativeNumberSchema,
    endorse: NonNegativeNumberSchema,
    iklan: NonNegativeNumberSchema,
    other: NonNegativeNumberSchema,
  }),
  daily: z.array(
    z.object({
      date: z.string().date(),
      variable: MarketingChannelSchema,
      totalCost: NonNegativeNumberSchema,
    }),
  ),
});

export const TargetProgressMetricSchema = z.object({
  target: NonNegativeNumberSchema,
  aktual: z.number(),
  progress: PercentageSchema.optional(),
  efficiency: PercentageSchema.optional(),
  gap: z.number().optional(),
});

export const TargetProgressResponseSchema = z.object({
  netSales: TargetProgressMetricSchema,
  marketingCost: TargetProgressMetricSchema,
  netProfit: TargetProgressMetricSchema,
});

export const StockStatusSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().min(1),
  totalQty: z.number().int(),
  averageOut: z.coerce.number().nullable(),
  limit0Days: z.coerce.number().nullable(),
  dateLimit: z.string().date().nullable(),
  qtyOpenPo: z.number().int().nullable(),
});

export const MoMMetricSchema = z.object({
  month: PeriodSchema,
  date: z.string().date(),
  dayOfMonth: z.number().int().min(1).max(31),
  netSales: NonNegativeNumberSchema,
  netProfit: z.number(),
  npm: PercentageSchema,
  chance: PercentageSchema,
});

export const StoreSchema = z.object({
  id: PositiveIntSchema,
  name: z.string().min(1),
  platform: z.string().min(1),
  storeType: z.string().min(1),
});

export const BrandSchema = z.object({
  id: PositiveIntSchema,
  name: z.string().min(1),
});

export const PlatformContributionSchema = z.object({
  storeId: PositiveIntSchema,
  storeName: z.string().min(1),
  netSales: NonNegativeNumberSchema,
});

export const DailyResponseSchema = z.array(DailyMetricSchema);
export const ProductResponseSchema = z.array(ProductMetricSchema);
export const StockResponseSchema = z.array(StockStatusSchema);
export const MoMResponseSchema = z.array(MoMMetricSchema);
export const StoresResponseSchema = z.array(StoreSchema);
export const BrandsResponseSchema = z.array(BrandSchema);
export const PlatformContributionResponseSchema = z.array(PlatformContributionSchema);

export const LegacyRunrateProductSchema = z.object({
  name: z.string().min(1),
  units: z.coerce.number(),
  gross: z.coerce.number(),
  margin: z.coerce.number(),
  aov: z.coerce.number(),
  marginPct: z.coerce.number(),
  marketingCost: z.coerce.number(),
  marketingPct: z.coerce.number(),
  netProfit: z.coerce.number(),
  npm: z.coerce.number(),
  contribSales: z.coerce.number(),
  contribProfit: z.coerce.number(),
  cls: z.string().min(1),
  classTxt: z.string().optional(),
});

export const LegacyRunrateResponseSchema = z.object({
  success: z.literal(true),
  month: z.string().min(1),
  progress: z.coerce.number(),
  products: z.array(LegacyRunrateProductSchema),
});

export const LegacyFunnelProductSchema = z.object({
  name: z.string().min(1),
  impressions: z.coerce.number(),
  ctr: z.coerce.number(),
  clicks: z.coerce.number(),
  cr: z.coerce.number(),
  orders: z.coerce.number(),
  halamanImp: z.coerce.number(),
  halamanCtr: z.coerce.number(),
  halamanClicks: z.coerce.number(),
  halamanCr: z.coerce.number(),
  halamanOrders: z.coerce.number(),
  ctor: z.coerce.number(),
  contribution: z.coerce.number(),
});

export const LegacyFunnelResponseSchema = z.object({
  success: z.literal(true),
  period: z.string().min(1),
  funnelProduk: z.array(LegacyFunnelProductSchema),
});

export type Period = z.infer<typeof PeriodSchema>;
export type Klasifikasi = z.infer<typeof KlasifikasiSchema>;
export type MarketingChannel = z.infer<typeof MarketingChannelSchema>;
export type RunRateFilter = z.infer<typeof RunRateFilterSchema>;
export type ProductFilter = z.infer<typeof ProductFilterSchema>;
export type MarketingFilter = z.infer<typeof MarketingFilterSchema>;
export type StockFilter = z.infer<typeof StockFilterSchema>;
export type MoMFilter = z.infer<typeof MoMFilterSchema>;
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;
export type DailyMetric = z.infer<typeof DailyMetricSchema>;
export type ProductMetric = z.infer<typeof ProductMetricSchema>;
export type MarketingResponse = z.infer<typeof MarketingResponseSchema>;
export type TargetProgressResponse = z.infer<typeof TargetProgressResponseSchema>;
export type StockStatus = z.infer<typeof StockStatusSchema>;
export type MoMMetric = z.infer<typeof MoMMetricSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type Brand = z.infer<typeof BrandSchema>;
export type PlatformContribution = z.infer<typeof PlatformContributionSchema>;
export type LegacyRunrateProduct = z.infer<typeof LegacyRunrateProductSchema>;
export type LegacyRunrateResponse = z.infer<typeof LegacyRunrateResponseSchema>;
export type LegacyFunnelProduct = z.infer<typeof LegacyFunnelProductSchema>;
export type LegacyFunnelResponse = z.infer<typeof LegacyFunnelResponseSchema>;
