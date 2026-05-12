"use client";

import { useQuery } from "@tanstack/react-query";
import { DailyResponseSchema, type RunRateFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateDailyQuery = (filter: RunRateFilter) =>
  useQuery({
    queryKey: ["run-rate", "daily", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/daily?${buildSearchParams(filter)}`, DailyResponseSchema),
    staleTime: 60_000,
  });
