"use client";

import { useQuery } from "@tanstack/react-query";
import { StoresResponseSchema } from "@/lib/validators/run-rate";
import { fetchRunRate } from "./use-run-rate-query-utils";

export const useRunRateStoresQuery = () =>
  useQuery({
    queryKey: ["run-rate", "stores"] as const,
    queryFn: () => fetchRunRate("/api/run-rate/stores", StoresResponseSchema),
    staleTime: 300_000,
  });
