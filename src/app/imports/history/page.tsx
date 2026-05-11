"use client";

import { useState } from "react";
import { useImportsQuery } from "@/hooks/use-imports-query";
import { ImportHistoryTable } from "@/components/imports/ImportHistoryTable";
import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { BrutalAlert } from "@/components/ui/BrutalAlert";
import { BrutalButton } from "@/components/ui/BrutalButton";
import type { ImportStatus, TemplateType } from "@/lib/validators/import";

const STATUS_OPTIONS = [
  { value: "preview", label: "Preview" },
  { value: "imported", label: "Imported" },
  { value: "failed", label: "Failed" },
];

const TEMPLATE_OPTIONS = [
  { value: "cohort_hourly", label: "Cohort Hourly" },
  { value: "host_gmv", label: "Host GMV" },
  { value: "order_detail", label: "Order Detail" },
  { value: "master_product", label: "Master Product" },
  { value: "host_okr", label: "Host OKR" },
];

export default function ImportHistoryPage() {
  const [status, setStatus] = useState<ImportStatus | undefined>();
  const [templateType, setTemplateType] = useState<TemplateType | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useImportsQuery({
    page,
    limit: 20,
    status,
    templateType,
  });

  const imports = (data as unknown[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-0.5">
          Data Import
        </p>
        <h1 className="text-2xl font-black text-neutral-950">Import History</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <BrutalSelect
          label="Status"
          options={STATUS_OPTIONS}
          placeholder="Semua Status"
          value={status ?? ""}
          onChange={(e) => {
            setStatus((e.target.value as ImportStatus) || undefined);
            setPage(1);
          }}
          className="w-36"
        />
        <BrutalSelect
          label="Template"
          options={TEMPLATE_OPTIONS}
          placeholder="Semua Template"
          value={templateType ?? ""}
          onChange={(e) => {
            setTemplateType((e.target.value as TemplateType) || undefined);
            setPage(1);
          }}
          className="w-44"
        />
        <BrutalButton variant="secondary" size="sm" onClick={() => refetch()}>
          Refresh
        </BrutalButton>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Memuat data...</p>}
      {isError && <BrutalAlert variant="error">{(error as Error).message}</BrutalAlert>}
      {!isLoading && !isError && (
        <ImportHistoryTable data={imports as Parameters<typeof ImportHistoryTable>[0]["data"]} />
      )}

      <div className="flex gap-2 justify-center">
        <BrutalButton
          size="sm"
          variant="secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          &larr; Prev
        </BrutalButton>
        <span className="px-3 py-1 text-xs font-semibold text-neutral-600 self-center">
          Hal. {page}
        </span>
        <BrutalButton
          size="sm"
          variant="secondary"
          onClick={() => setPage((p) => p + 1)}
          disabled={imports.length < 20}
        >
          Next &rarr;
        </BrutalButton>
      </div>
    </div>
  );
}
