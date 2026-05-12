"use client";

import { useState } from "react";
import Link from "next/link";
import { ImportUploader } from "@/components/imports/ImportUploader";
import { ImportPreview } from "@/components/imports/ImportPreview";
import { GSheetsSyncForm } from "@/components/imports/GSheetsSyncForm";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { useImportPreviewMutation } from "@/hooks/use-import-preview-mutation";
import { useGSheetsSyncMutation } from "@/hooks/use-gsheets-sync-mutation";
import type { ImportPreviewResult } from "@/lib/validators/import";

type ImportMode = "gsheets" | "upload";

export default function ImportsPage() {
  const [mode, setMode] = useState<ImportMode>("gsheets");
  const [previews, setPreviews] = useState<ImportPreviewResult[] | null>(null);
  const previewMutation = useImportPreviewMutation();
  const gsheetsMutation = useGSheetsSyncMutation();

  async function handleFile(file: File) {
    setPreviews(null);
    const result = await previewMutation.mutateAsync(file).catch(() => null);
    if (result) setPreviews(result);
  }

  async function handleGSheets(url: string) {
    setPreviews(null);
    const result = await gsheetsMutation.mutateAsync(url).catch(() => null);
    if (result) setPreviews(result);
  }

  function handleReset() {
    setPreviews(null);
    previewMutation.reset();
    gsheetsMutation.reset();
  }

  const isError = previewMutation.isError || gsheetsMutation.isError;
  const errorMsg = (previewMutation.error ?? gsheetsMutation.error) as Error | null;
  const isPending = previewMutation.isPending || gsheetsMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
            Data Import
          </p>
          <h1 className="text-2xl font-black text-neutral-950">Upload & Import</h1>
        </div>
        <Link
          href="/imports/history"
          className="text-sm font-semibold underline text-neutral-600 hover:text-neutral-950"
        >
          Lihat History →
        </Link>
      </div>

      {/* Mode tabs + form */}
      {!previews && (
        <>
          <div className="flex gap-2">
            <BrutalButton
              variant={mode === "gsheets" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setMode("gsheets")}
            >
              Google Sheets
            </BrutalButton>
            <BrutalButton
              variant={mode === "upload" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setMode("upload")}
            >
              Upload File
            </BrutalButton>
          </div>

          {mode === "gsheets" ? (
            <GSheetsSyncForm onSync={handleGSheets} isPending={isPending} />
          ) : (
            <ImportUploader onFile={handleFile} isPending={isPending} />
          )}
        </>
      )}

      {/* Error */}
      {isError && (
        <BrutalAlert variant="error" title="Gagal memproses">
          {errorMsg?.message ?? "Terjadi kesalahan"}
        </BrutalAlert>
      )}

      {/* Preview */}
      {previews && (
        <ImportPreview previews={previews} onReset={handleReset} />
      )}
    </div>
  );
}
