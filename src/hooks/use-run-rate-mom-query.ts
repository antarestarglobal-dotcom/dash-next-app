"use client";

import { useQuery } from "@tanstack/react-query";
import { MoMResponseSchema, type MoMFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

const toMomParams = (filter: MoMFilter): URLSearchParams => {
  const params = buildSearchParams({ storeId: filter.storeId });
  filter.months.forEach((month) => params.append("months[]", month));
  return params;
};

export const useRunRateMoMQuery = (filter: MoMFilter) =>
  useQuery({
    queryKey: ["run-rate", "mom", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/mom?${toMomParams(filter)}`, MoMResponseSchema),
    staleTime: 60_000,
  });
