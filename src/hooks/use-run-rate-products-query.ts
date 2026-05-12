"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductResponseSchema, type ProductFilter } from "@/lib/validators/run-rate";
import { buildSearchParams, fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateProductsQuery = (filter: ProductFilter) =>
  useQuery({
    queryKey: ["run-rate", "products", filter] as const,
    queryFn: () => fetchRunRate(`/api/run-rate/products?${buildSearchParams(filter)}`, ProductResponseSchema),
    staleTime: 60_000,
  });
