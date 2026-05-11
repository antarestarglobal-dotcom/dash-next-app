"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";

export function useConfirmImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importId: string) =>
      apiFetch("/api/imports/confirm", z.object({ message: z.string() }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importId }),
      }),
    onSuccess: (_data, importId) => {
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["import", importId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
