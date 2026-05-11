"use client";

import { useState } from "react";
import { ImportUploader } from "@/components/imports/ImportUploader";
import { ImportPreview } from "@/components/imports/ImportPreview";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import { useImportPreviewMutation } from "@/hooks/use-import-preview-mutation";
import type { ImportPreviewResult } from "@/lib/validators/import";
import Link from "next/link";

export default function ImportsPage() {
  const [previews, setPreviews] = useState<ImportPreviewResult[] | null>(null);
  const previewMutation = useImportPreviewMutation();

  async function handleFile(file: File) {
    setPreviews(null);
    try {
      const result = await previewMutation.mutateAsync(file);
      setPreviews(result);
    } catch {
      // Error shown via previewMutation.isError
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
            Data Import
          </p>
          <h1 className="text-2xl font-black text-neutral-950">Upload & Import</h1>
        </div>
        <Link href="/imports/history" className="text-sm font-semibold underline text-neutral-600 hover:text-neutral-950">
          Lihat History →
        </Link>
      </div>

      {!previews && (
        <ImportUploader onFile={handleFile} isPending={previewMutation.isPending} />
      )}

      {previewMutation.isError && (
        <BrutalAlert variant="error" title="Gagal memproses file">
          {previewMutation.error.message}
        </BrutalAlert>
      )}

      {previews && (
        <ImportPreview previews={previews} onReset={() => { setPreviews(null); previewMutation.reset(); }} />
      )}
    </div>
  );
}
