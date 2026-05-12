"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { DashboardResponseSchema } from "@/lib/validators/dashboard";
import type { DashboardFilter } from "@/lib/validators/dashboard";

export function useDashboardQuery(filters: DashboardFilter = {}) {
  return useQuery({
    queryKey: ["dashboard", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.brandId) params.set("brandId", String(filters.brandId));
      if (filters.platformId) params.set("platformId", String(filters.platformId));
      if (filters.channelId) params.set("channelId", String(filters.channelId));
      if (filters.metric) params.set("metric", filters.metric);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      return apiFetch(`/api/dashboard?${params}`, DashboardResponseSchema);
    },
    staleTime: 30_000,
  });
}
