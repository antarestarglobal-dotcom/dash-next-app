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

export type DashboardFilter = z.infer<typeof DashboardFilterSchema>;
