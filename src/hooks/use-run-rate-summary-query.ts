"use client";

import { useQuery } from "@tanstack/react-query";
import { SummaryResponseSchema, type RunRateFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateSummaryQuery = (filter: RunRateFilter) =>
  useQuery({
    queryKey: ["run-rate", "summary", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/summary?${buildSearchParams(filter)}`, SummaryResponseSchema),
    staleTime: 60_000,
  });
