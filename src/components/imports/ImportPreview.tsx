"use client";

import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import { ImportWarnings } from "./ImportWarnings";
import { PreviewRowsTable } from "./PreviewRowsTable";
import { useConfirmImportMutation } from "@/hooks/use-confirm-import-mutation";
import { formatNumber } from "@/lib/utils";

interface PreviewItem {
  importId: string;
  sourceName: string;
  sheetName: string;
  templateType: string;
  period: string | null;
  metric: string | null;
  platform: string | null;
  brand: string | null;
  channel: string | null;
  validRows: number;
  rejectedRowsCount: number;
  warnings: string[];
  previewRows: Record<string, unknown>[];
  hasFatalError: boolean;
  errorMessage: string | null;
}

interface ImportPreviewProps {
  previews: PreviewItem[];
  onReset: () => void;
}

export function ImportPreview({ previews, onReset }: ImportPreviewProps) {
  const confirmMutation = useConfirmImportMutation();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-neutral-950">
          Preview — {previews.length} sheet terdeteksi
        </h2>
        <BrutalButton variant="secondary" size="sm" onClick={onReset}>
          Upload File Baru
        </BrutalButton>
      </div>

      {previews.map((preview) => (
        <BrutalCard
          key={preview.importId}
          title={`${preview.sheetName} — ${preview.templateType}`}
        >
          {preview.hasFatalError ? (
            <BrutalAlert variant="error" title="Parse Gagal">
              {preview.errorMessage}
            </BrutalAlert>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <MetaField label="Source" value={preview.sourceName} />
                <MetaField label="Template" value={preview.templateType} />
                <MetaField label="Period" value={preview.period} />
                <MetaField label="Metric" value={preview.metric} />
                <MetaField label="Brand" value={preview.brand} />
                <MetaField label="Platform" value={preview.platform} />
                <MetaField label="Channel" value={preview.channel} />
                <div>
                  <p className="text-xs text-neutral-500 font-semibold uppercase">Rows</p>
                  <p className="font-bold text-neutral-950">
                    {formatNumber(preview.validRows)} valid,{" "}
                    <span className="text-red-700">{preview.rejectedRowsCount} ditolak</span>
                  </p>
                </div>
              </div>

              {/* Warnings */}
              <ImportWarnings
                warnings={preview.warnings}
                rejectedCount={preview.rejectedRowsCount}
              />

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold text-neutral-600 uppercase mb-2">
                  Preview 10 Baris Pertama
                </p>
                <PreviewRowsTable rows={preview.previewRows} />
              </div>

              {/* Confirm */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                {confirmMutation.isSuccess ? (
                  <BrutalAlert variant="success">Import berhasil dikonfirmasi.</BrutalAlert>
                ) : confirmMutation.isError ? (
                  <BrutalAlert variant="error">{confirmMutation.error.message}</BrutalAlert>
                ) : (
                  <div />
                )}
                <BrutalButton
                  onClick={() => confirmMutation.mutate(preview.importId)}
                  disabled={confirmMutation.isPending || confirmMutation.isSuccess}
                >
                  {confirmMutation.isPending ? "Mengimport..." : "Confirm Import"}
                </BrutalButton>
              </div>
            </div>
          )}
        </BrutalCard>
      ))}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-neutral-500 font-semibold uppercase">{label}</p>
      <p className="font-medium text-neutral-950 text-sm">{value ?? "-"}</p>
    </div>
  );
}
