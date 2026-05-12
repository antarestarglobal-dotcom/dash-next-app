"use client";

import { useQuery } from "@tanstack/react-query";
import { PlatformContributionResponseSchema, type RunRateFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRatePlatformContributionQuery = (filter: RunRateFilter) =>
  useQuery({
    queryKey: ["run-rate", "platform-contribution", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/platform-contribution?${buildSearchParams(filter)}`, PlatformContributionResponseSchema),
    staleTime: 60_000,
  });
