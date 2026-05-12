import { z } from "zod";

export const DashboardFilterSchema = z.object({
  period: z.string().optional(),
  brandId: z.coerce.number().int().optional(),
  platformId: z.coerce.number().int().optional(),
  channelId: z.coerce.number().int().optional(),
  metric: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const NumericLikeSchema = z.union([z.number(), z.string().min(1)]).transform((value) =>
  typeof value === "number" ? value : Number(value),
);

const NullableNumericLikeSchema = z
  .union([z.number(), z.string().min(1), z.null()])
  .transform((value) => (value === null ? null : Number(value)));

export const DashboardSummarySchema = z.object({
  totalMtd: NumericLikeSchema,
  dailyAvg: NumericLikeSchema,
  bestDayTotal: NumericLikeSchema,
  rowCount: NumericLikeSchema,
});

export const DashboardDailyMetricRowSchema = z.object({
  id: z.number().int(),
  date: z.string(),
  dayName: z.string().nullable(),
  metric: z.string(),
  total: NullableNumericLikeSchema,
  contributionPercent: NullableNumericLikeSchema,
});

export const DashboardHeatmapRowSchema = z.object({
  date: z.string(),
  hour: z.number().int().min(0).max(23),
  valuePercent: NullableNumericLikeSchema,
});

export const DashboardHostLeaderboardRowSchema = z.object({
  hostId: z.number().int().nullable(),
  hostName: z.string(),
  totalGmv: NullableNumericLikeSchema,
});

export const DashboardBestHourSchema = z.object({
  hour: z.number().int().min(0).max(23).nullable(),
  avgPercent: NumericLikeSchema,
});

export const DashboardResponseSchema = z.object({
  summary: DashboardSummarySchema,
  dailyMetrics: z.array(DashboardDailyMetricRowSchema),
  heatmap: z.array(DashboardHeatmapRowSchema),
  hostLeaderboard: z.array(DashboardHostLeaderboardRowSchema),
  bestHour: DashboardBestHourSchema,
});

export type DashboardFilter = z.infer<typeof DashboardFilterSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
export type DashboardDailyMetricRow = z.infer<typeof DashboardDailyMetricRowSchema>;
export type DashboardHeatmapRow = z.infer<typeof DashboardHeatmapRowSchema>;
export type DashboardHostLeaderboardRow = z.infer<typeof DashboardHostLeaderboardRowSchema>;
export type DashboardBestHour = z.infer<typeof DashboardBestHourSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
