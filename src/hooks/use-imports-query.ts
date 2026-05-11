"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import type { ImportStatus, TemplateType } from "@/lib/validators/import";

interface UseImportsQueryOptions {
  page?: number;
  limit?: number;
  status?: ImportStatus;
  templateType?: TemplateType;
}

export function useImportsQuery(options: UseImportsQueryOptions = {}) {
  const { page = 1, limit = 20, status, templateType } = options;

  return useQuery({
    queryKey: ["imports", { page, limit, status, templateType }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set("status", status);
      if (templateType) params.set("templateType", templateType);
      return apiFetch(`/api/imports?${params}`, z.array(z.unknown()));
    },
  });
}

export function useImportDetailQuery(importId: string | null) {
  return useQuery({
    queryKey: ["import", importId],
    queryFn: () => apiFetch(`/api/imports/${importId}`, z.unknown()),
    enabled: !!importId,
  });
}
