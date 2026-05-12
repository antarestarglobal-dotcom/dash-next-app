"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLegacyApi } from "./use-legacy-api-query-utils";
import { LegacyRunrateResponseSchema } from "@/lib/validators/run-rate";

export const useRunrateLegacyQuery = () =>
  useQuery({
    queryKey: ["legacy", "runrate"] as const,
    queryFn: () => fetchLegacyApi("/api/runrate", LegacyRunrateResponseSchema),
    staleTime: 60_000,
  });
