"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLegacyApi } from "./use-legacy-api-query-utils";
import { LegacyFunnelResponseSchema } from "@/lib/validators/run-rate";

export const useFunnelLegacyQuery = () =>
  useQuery({
    queryKey: ["legacy", "funnel"] as const,
    queryFn: () => fetchLegacyApi("/api/funnel", LegacyFunnelResponseSchema),
    staleTime: 60_000,
  });
