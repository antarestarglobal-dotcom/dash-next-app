"use client";

import { useQuery } from "@tanstack/react-query";
import { StockResponseSchema, type StockFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateStockQuery = (filter: StockFilter) =>
  useQuery({
    queryKey: ["run-rate", "stock", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/stock?${buildSearchParams(filter)}`, StockResponseSchema),
    staleTime: 60_000,
  });
