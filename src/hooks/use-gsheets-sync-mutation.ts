"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ImportPreviewResponseSchema } from "@/lib/validators/import";

export function useGSheetsSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) =>
      apiFetch("/api/imports/sync-gsheets", ImportPreviewResponseSchema, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
    },
  });
}
