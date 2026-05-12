"use client";

import { useQuery } from "@tanstack/react-query";
import { BrandsResponseSchema } from "@/lib/validators/run-rate";
import { fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateBrandsQuery = () =>
  useQuery({
    queryKey: ["run-rate", "brands"] as const,
    queryFn: () => fetchRunRate("/api/run-rate/brands", BrandsResponseSchema),
    staleTime: 300_000,
  });
