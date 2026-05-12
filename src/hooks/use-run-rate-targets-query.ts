"use client";

import { useQuery } from "@tanstack/react-query";
import { TargetProgressResponseSchema, type RunRateFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateTargetsQuery = (filter: RunRateFilter) =>
  useQuery({
    queryKey: ["run-rate", "targets", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/targets?${buildSearchParams(filter)}`, TargetProgressResponseSchema),
    staleTime: 60_000,
  });
