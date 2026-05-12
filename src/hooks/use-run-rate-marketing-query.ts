"use client";

import { useQuery } from "@tanstack/react-query";
import { MarketingResponseSchema, type MarketingFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateMarketingQuery = (filter: MarketingFilter) =>
  useQuery({
    queryKey: ["run-rate", "marketing", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/marketing?${buildSearchParams(filter)}`, MarketingResponseSchema),
    staleTime: 60_000,
  });
